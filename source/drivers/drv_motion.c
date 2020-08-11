/*
  Copyright (c) 2010 - 2017, Nordic Semiconductor ASA
  All rights reserved.

  Redistribution and use in source and binary forms, with or without modification,
  are permitted provided that the following conditions are met:

  1. Redistributions of source code must retain the above copyright notice, this
     list of conditions and the following disclaimer.

  2. Redistributions in binary form, except as embedded into a Nordic
     Semiconductor ASA integrated circuit in a product or a software update for
     such product, must reproduce the above copyright notice, this list of
     conditions and the following disclaimer in the documentation and/or other
     materials provided with the distribution.

  3. Neither the name of Nordic Semiconductor ASA nor the names of its
     contributors may be used to endorse or promote products derived from this
     software without specific prior written permission.

  4. This software, with or without modification, must only be used with a
     Nordic Semiconductor ASA integrated circuit.

  5. Any software provided in binary form under this license must not be reverse
     engineered, decompiled, modified and/or disassembled.

  THIS SOFTWARE IS PROVIDED BY NORDIC SEMICONDUCTOR ASA "AS IS" AND ANY EXPRESS
  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
  OF MERCHANTABILITY, NONINFRINGEMENT, AND FITNESS FOR A PARTICULAR PURPOSE ARE
  DISCLAIMED. IN NO EVENT SHALL NORDIC SEMICONDUCTOR ASA OR CONTRIBUTORS BE
  LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
  CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
  HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
  LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT
  OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#include "pca20020.h"
#include "drv_motion.h"
#include "drv_mpu9250.h"
#include "nrf_error.h"
#include "app_timer.h"
#include "drv_acc.h"
#include "app_timer.h"
#include "app_scheduler.h"
#include "thingy_config.h"
#include "nrf_delay.h"
#include "drv_ext_gpio.h"
#include "nrf_drv_gpiote.h"
#include "drv_speaker.h"
#include "nrf_drv_pwm.h"
#include "ble_advertising.h"

#include "inv_mpu.h"
#include "inv_mpu_dmp_motion_driver.h"
#include "invensense.h"
#include "invensense_adv.h"
#include "eMPL_outputs.h"
#include "mltypes.h"
#include "mpu.h"

#define PEDO_READ_MS    (1000UL) ///< Default pedometer period [ms].
#define TEMP_READ_MS     (500UL) ///< Default temperature period [ms].
#define COMPASS_READ_MS  (500UL) ///< Default compass (magnetometer) period [ms].
#define DEFAULT_MPU_HZ    (10UL) ///< Default motion processing unit period [ms].
#define DEFAULT_IMP_THR    (4UL) ///< Default motion processing unit period [ms].
#define NUM_AXES             (3) ///< Number of principal axes for each sensor type.
#define  NRF_LOG_MODULE_NAME "drv_motion    "
#include "nrf_log.h"
#include "macros_common.h"

#define RAW_Q_FORMAT_INTEGER_BITS 65536     // Number of bits used for raw data.
#define RAW_Q_FORMAT_ACC_INTEGER_BITS 6     // Number of bits used for integer part of raw data.
#define RAW_Q_FORMAT_GYR_INTEGER_BITS 11    // Number of bits used for integer part of raw data.
#define RAW_Q_FORMAT_CMP_INTEGER_BITS 12    // Number of bits used for integer part of raw data.

#define RETURN_IF_INV_ERROR(PARAM)                                                                \
        if ((PARAM) != INV_SUCCESS)                                                               \
        {                                                                                         \
            return NRF_ERROR_INTERNAL;                                                            \
        }

unsigned char *mpl_key = (unsigned char*)"eMPL 5.1";

/**@brief Platform-specific information. Kinda like a boardfile.
 */
typedef struct
{
    signed char orientation[9];
} platform_data_t;

/**@brief Acclerometer rotation matrix.
 *
 * @note Accellerometer inverted to get positive readings when axis is aligned with g (down).
 */
static platform_data_t s_accel_pdata =
{
    .orientation = { -1,  0,  0,
                      0, -1,  0,
                      0,  0, -1}
};

/**@brief Gyroscope rotation matrix.
 *
 * @note No rotation needed as the gyro axes are alinged with Thingy axes.
 */
static platform_data_t s_gyro_pdata = 
{
    .orientation = {  1,  0,  0,
                      0,  1,  0,
                      0,  0,  1}
};

/**@brief Compass (magnetometer) rotation matrix.
 *
 * @note Changed to align the +Y vector of the compass to Thingy +X.
 * This is performed due to the IMU using +Y as the heading reference.
 */
static platform_data_t s_compass_pdata =
{
    .orientation = { -1,  0,  0,
                      0,  1,  0,
                      0,  0, -1}
};

static struct
{
    bool                      lp_accel_mode;
    bool                      running;
    uint8_t                   sensors;
    bool                      dmp_on;
    uint16_t                  dmp_features;
    drv_motion_feature_mask_t features;
    drv_motion_evt_handler_t  evt_handler;
    bool                      do_temp;
    bool                      do_compass;
    bool                      do_pedo;
    uint16_t                  pedo_interval_ms;
    uint16_t                  temp_interval_ms;
    uint16_t                  compass_interval_ms;
    uint16_t                  motion_freq_hz;
    uint8_t                   wake_on_motion;
    uint16_t                  impact_threshold;
} m_motion;

static struct
{
    int16_t  acc_x[MAX_IMPACT_SAMPLES];
    int16_t  acc_y[MAX_IMPACT_SAMPLES];
    int16_t  acc_z[MAX_IMPACT_SAMPLES];
    int16_t  gyro_x[MAX_IMPACT_SAMPLES];
    int16_t  gyro_y[MAX_IMPACT_SAMPLES];
    int16_t  gyro_z[MAX_IMPACT_SAMPLES];
    int32_t  roll[MAX_IMPACT_SAMPLES];
    int32_t  pitch[MAX_IMPACT_SAMPLES];
    int32_t  yaw[MAX_IMPACT_SAMPLES];
    uint16_t currentIndex;
    uint16_t impactIndex;
    uint16_t writeIndex;
    int32_t  previousAcceleration;
    bool     impact;
} m_impact;

static struct{
    int16_t entryIndex;
    int16_t exitIndex;
    int16_t size;
    int16_t data[MAX_QUEUE_SIZE];
    uint16_t type;
} m_impact_queue;

static struct
{
    uint8_t                volume;
    uint16_t               duration;
    uint16_t               center_freq_hz;
    bool                   enabled;
    bool                   precision;
    int16_t                stationary;
    sonification_channel_t channel;
    sonification_sensor_t  sensor;
} m_sonification;

/* Compass bias written to MPU-9250 at boot. Used to compensate for biases introduced by Thingy HW.
 */
static const long COMPASS_BIAS[NUM_AXES] = {1041138*(2^16), -3638024*(2^16), -23593626*(2^16)}; 

APP_TIMER_DEF(m_temp_timer_id);
APP_TIMER_DEF(m_compass_timer_id);
APP_TIMER_DEF(m_pedo_timer_id);

#if NRF_LOG_ENABLED
    void print_sensor_status(void)
    {
        long acc_bias[NUM_AXES];
        long gyr_bias[NUM_AXES];
        long mag_bias[NUM_AXES];
        int acc_accuracy;
        int gyr_accuracy;
        int mag_accuracy;
        
        inv_get_accel_bias(acc_bias, NULL);
        inv_get_gyro_bias(gyr_bias, NULL);
        inv_get_compass_bias(mag_bias);
        
        acc_accuracy = inv_get_accel_accuracy();
        gyr_accuracy = inv_get_gyro_accuracy();
        mag_accuracy = inv_get_mag_accuracy();
        
        NRF_LOG_DEBUG("Acc bias: ");
        NRF_LOG_DEBUG("X: "NRF_LOG_FLOAT_MARKER" ",     NRF_LOG_FLOAT(acc_bias[0]));
        NRF_LOG_DEBUG("Y: "NRF_LOG_FLOAT_MARKER" ",     NRF_LOG_FLOAT(acc_bias[1]));
        NRF_LOG_DEBUG("Z: "NRF_LOG_FLOAT_MARKER" \r\n", NRF_LOG_FLOAT(acc_bias[2]));
        
        NRF_LOG_DEBUG("Gyr bias: "); 
        NRF_LOG_DEBUG("X: "NRF_LOG_FLOAT_MARKER" ",     NRF_LOG_FLOAT(gyr_bias[0]));
        NRF_LOG_DEBUG("Y: "NRF_LOG_FLOAT_MARKER" ",     NRF_LOG_FLOAT(gyr_bias[1]));
        NRF_LOG_DEBUG("Z: "NRF_LOG_FLOAT_MARKER" \r\n", NRF_LOG_FLOAT(gyr_bias[2]));

        NRF_LOG_DEBUG("Mag bias: ");
        NRF_LOG_DEBUG("X: "NRF_LOG_FLOAT_MARKER" ",     NRF_LOG_FLOAT(mag_bias[0]/(2^16)));
        NRF_LOG_DEBUG("Y: "NRF_LOG_FLOAT_MARKER" ",     NRF_LOG_FLOAT(mag_bias[1]/(2^16)));
        NRF_LOG_DEBUG("Z: "NRF_LOG_FLOAT_MARKER" \r\n", NRF_LOG_FLOAT(mag_bias[2]/(2^16)));

        NRF_LOG_DEBUG("Accur: Acc: %d, gyr: %d, mag: %d \r\n", acc_accuracy, gyr_accuracy, mag_accuracy);
    }
#endif


static void mpulib_data_send(void)
{
    inv_time_t       timestamp;
    int8_t           accuracy;
    int32_t          data[9];
    drv_motion_evt_t evt;

    if (m_motion.features & DRV_MOTION_FEATURE_MASK_SONIFICATION){
        int32_t frequency_offset;   // How many Hz we offset the central frequency.
        bool    valid_data = false; // True if we read valid data from the sensors.
        bool    reset = false;      // True if we need to restart the spekear.
        int16_t precision;          // Precision used for sensor data (decimals).
        int16_t scaler;             // Used to scale all data equally in spite of precision.
        int16_t bit_offset;         // Number of bits used to shift data.

        // Read data from sensors and set other variables
        switch (m_sonification.sensor){
            case SONIFICATION_SENSOR_EULER:
                if (inv_get_sensor_type_euler((long *)data, &accuracy, &timestamp)){
                    valid_data = true;
                }
                bit_offset = BIT_OFFSET_EULER;
                if(m_sonification.precision){
                    precision = PRECISION_EULER_HIGH;
                    scaler = SCALER_EULER_HIGH;
                }else{
                    precision = PRECISION_EULER_LOW;
                    scaler = SCALER_EULER_LOW;
                }
                break;
            case SONIFICATION_SENSOR_RAW_ACCEL:
                if (inv_get_sensor_type_accel((long *)&data[0], &accuracy, &timestamp)){
                    valid_data = true;
                }
                bit_offset = BIT_OFFSET_RAW_ACC;
                if(m_sonification.precision){
                    precision = PRECISION_ACC_HIGH;
                    scaler = SCALER_ACC_HIGH;
                }else{
                    precision = PRECISION_ACC_LOW;
                    scaler = SCALER_ACC_LOW;
                }
                break;
            case SONIFICATION_SENSOR_RAW_GYRO:
                if (inv_get_sensor_type_gyro((long *)&data[0], &accuracy, &timestamp)){
                    valid_data = true;
                }
                bit_offset = BIT_OFFSET_RAW_GYRO;
                if(m_sonification.precision){
                    precision = PRECISION_GYRO_HIGH;
                    scaler = SCALER_GYRO_HIGH;
                }else{
                    precision = PRECISION_GYRO_LOW;
                    scaler = SCALER_GYRO_LOW;
                }
                break;
        }

        // Convert output to Hz
        if (valid_data){
            switch(m_sonification.channel){
                case SONIFICATION_CHANNEL_ROLL:
                case SONIFICATION_CHANNEL_RAW_ACCEL_X:
                case SONIFICATION_CHANNEL_RAW_GYRO_X:
                    frequency_offset = (data[0] * precision) >> bit_offset;
                    frequency_offset *= scaler;
                    break;
                case SONIFICATION_CHANNEL_PITCH:
                case SONIFICATION_CHANNEL_RAW_ACCEL_Y:
                case SONIFICATION_CHANNEL_RAW_GYRO_Y:
                    frequency_offset = (data[1] * precision) >> bit_offset;
                    frequency_offset *= scaler;
                    break;
                case SONIFICATION_CHANNEL_YAW:
                case SONIFICATION_CHANNEL_RAW_ACCEL_Z:
                case SONIFICATION_CHANNEL_RAW_GYRO_Z:
                    frequency_offset = (data[2] * precision) >> bit_offset;
                    frequency_offset *= scaler;
                    break;
                default:
                    frequency_offset = 0;
                    break;
            }

            // Edge cases correction
            switch (m_sonification.sensor){
                case SONIFICATION_SENSOR_EULER:
                case SONIFICATION_SENSOR_RAW_ACCEL:
                    if (frequency_offset < MINIMUM_FREQUENCY_OFFSET){
                        frequency_offset = MINIMUM_FREQUENCY_OFFSET;
                    }
                    break;
                case SONIFICATION_SENSOR_RAW_GYRO:
                    frequency_offset = abs(frequency_offset);
                    // Count number of consecutive samples where there is no motion
                    if (frequency_offset <= GYROSCOPE_MOVEMENT_THRESHOLD){
                        frequency_offset = -m_sonification.center_freq_hz;
                        m_sonification.stationary++;
                    }else{
                        // Reset Thingy speaker
                        if (m_sonification.stationary >= GYROSCOPE_MOVEMENT_THRESHOLD_SAMPLES){
                            reset = true;
                        }
                        m_sonification.stationary = 0;
                    }
                    break;
            }
            NRF_LOG_DEBUG("Offset is: %d\r\n", frequency_offset);

            // Stop sound as there is no motion
            if (m_sonification.stationary == GYROSCOPE_MOVEMENT_THRESHOLD_SAMPLES) {
                drv_speaker_tone_start(m_sonification.center_freq_hz , 0, 0);
            }else{
                if (reset){
                    drv_speaker_tone_start(m_sonification.center_freq_hz + frequency_offset, m_sonification.duration, m_sonification.volume);
                }
                drv_speaker_multi_tone_update(m_sonification.center_freq_hz + frequency_offset, m_sonification.duration, m_sonification.volume);
            }
        }
    }

    if (m_motion.features & DRV_MOTION_FEATURE_MASK_RAW)
    {
        bool valid_raw = false;
        if (m_motion.features & DRV_MOTION_FEATURE_MASK_RAW_ACCEL)
        {
            if (inv_get_sensor_type_accel((long *)&data[0], &accuracy, &timestamp))
            {
                // X, Y, and Z
                valid_raw = true;
            }
            else
            {
                data[0] = 0;
                data[1] = 0;
                data[2] = 0;
            }
        }

        if (m_motion.features & DRV_MOTION_FEATURE_MASK_RAW_GYRO)
        {
            if (inv_get_sensor_type_gyro((long *)&data[3], &accuracy, &timestamp))
            {
                // X, Y, and Z
                valid_raw = true;
            }
            else
            {
                data[3] = 0;
                data[4] = 0;
                data[5] = 0;
            }
        }

        if (m_motion.features & DRV_MOTION_FEATURE_MASK_RAW_COMPASS)
        {
            if (inv_get_sensor_type_compass((long *)&data[6], &accuracy, &timestamp))
            {
                // X, Y, and Z
                valid_raw = true;
            }
            else
            {
                data[6] = 0;
                data[7] = 0;
                data[8] = 0;
            }
        }

        if (valid_raw)
        {
            evt = DRV_MOTION_EVT_RAW;
            m_motion.evt_handler(&evt, data, sizeof(long) * 9);
        }
    }

    if (m_motion.features & DRV_MOTION_FEATURE_MASK_QUAT)
    {
        if (inv_get_sensor_type_quat((long *)data, &accuracy, &timestamp))
        {
            evt = DRV_MOTION_EVT_QUAT;
            // W, X, Y, and Z
            m_motion.evt_handler(&evt, data, sizeof(long) * 4);
        }
    }

    if (m_motion.features & DRV_MOTION_FEATURE_MASK_EULER)
    {
        if (inv_get_sensor_type_euler((long *)data, &accuracy, &timestamp))
        {
            evt = DRV_MOTION_EVT_EULER;
            // Roll, pitch and yaw
            m_motion.evt_handler(&evt, data, sizeof(long) * 3);
        }
    }

    if (m_motion.features & DRV_MOTION_FEATURE_MASK_ROT_MAT)
    {
        if (inv_get_sensor_type_rot_mat((long *)data, &accuracy, &timestamp))
        {
            evt = DRV_MOTION_EVT_ROT_MAT;
            m_motion.evt_handler(&evt, data, sizeof(long) * 9);
        }
    }

    if (m_motion.features & DRV_MOTION_FEATURE_MASK_HEADING)
    {
        if (inv_get_sensor_type_heading((long *)data, &accuracy, &timestamp))
        {
            evt = DRV_MOTION_EVT_HEADING;
            
            // Reverse the heading
            static const long north = 360 << 16;
            long heading = north - *data;
            
            m_motion.evt_handler(&evt, &heading, sizeof(long));
        }
    }

    if (m_motion.features & DRV_MOTION_FEATURE_MASK_GRAVITY_VECTOR)
    {
        float gravity[3];

        if (inv_get_sensor_type_gravity(gravity, &accuracy, &timestamp))
        {
            evt = DRV_MOTION_EVT_GRAVITY;
            // X, Y and Z
            m_motion.evt_handler(&evt, gravity, sizeof(float) * 3);
        }
    }

    if (m_motion.features & DRV_MOTION_FEATURE_MASK_PEDOMETER && m_motion.do_pedo)
    {
        static unsigned long s_prev_pedo[2] = {0};  // Step_count, walk_time;
        unsigned long pedometer[2] = {0};           // Step_count, walk_time;
        m_motion.do_pedo = 0;

        (void)dmp_get_pedometer_step_count(&pedometer[0]);
        (void)dmp_get_pedometer_walk_time(&pedometer[1]);

        if ((pedometer[0] > 0) && ((pedometer[0] != s_prev_pedo[0]) || (pedometer[1] != s_prev_pedo[1])))
        {
            evt = DRV_MOTION_EVT_PEDOMETER;
            // Step_count and walk_time
            m_motion.evt_handler(&evt, pedometer, sizeof(unsigned long) * 2);

            s_prev_pedo[0] = pedometer[0];
            s_prev_pedo[1] = pedometer[1];
        }
    }

    if (m_motion.features & DRV_MOTION_FEATURE_MASK_IMPACT){

        // Accelerometer
        float current_acceleration = drv_motion_read_impact_acceleration(&accuracy, &timestamp);
        // Gyroscope
        drv_motion_read_impact_gyroscope(&accuracy, &timestamp);
        // Euler
        drv_motion_read_impact_euler(&accuracy, &timestamp);

        // Determine if impact ocurrs and its peak
        if (!m_impact.impact && current_acceleration > (m_motion.impact_threshold * m_motion.impact_threshold)){
            if (m_impact.previousAcceleration > current_acceleration){
                    m_impact.impact = true;
                    m_impact.writeIndex = (m_impact.currentIndex + m_motion.motion_freq_hz) % (2 * m_motion.motion_freq_hz + 1);
                    m_impact.impactIndex = m_impact.writeIndex;
            } else{
                m_impact.previousAcceleration = current_acceleration;
            }
        }

        // Add impact values to queue
        if (m_impact.impact){
            drv_motion_queue_add_acceleration();
            drv_motion_queue_add_gyroscope();
            drv_motion_queue_add_euler();
            m_impact.writeIndex = (m_impact.writeIndex + 1) % (2 * m_motion.motion_freq_hz + 1);
            if (m_impact.writeIndex == m_impact.impactIndex){
                m_impact.impact = false;
                m_impact.previousAcceleration = 0;
            }
        }

        // Send impact values to event handler
        if (m_impact_queue.size){
            int16_t data[7];
            data[0] = m_impact_queue.type;

            for (uint8_t i = 1; i < 7; i++){
                data[i] = drv_motion_dequeue();
            }

            evt = DRV_MOTION_EVT_IMPACT;
            m_impact_queue.type ^= 1;
            m_motion.evt_handler(&evt, data, sizeof(int16_t) * 7);
        }

        m_impact.currentIndex = (m_impact.currentIndex + 1) % (2 * m_motion.motion_freq_hz + 1);
    }
}


static void mpulib_data_handler(void * p_event_data, uint16_t event_size)
{
    bool more_todo;

    do
    {
        unsigned long sensor_timestamp;
        int new_data = 0;
        more_todo = false;

        if (m_motion.lp_accel_mode)
        {
            short accel_short[3];
            long accel[3];

            (void)mpu_get_accel_reg(accel_short, &sensor_timestamp);

            accel[0] = (long)accel_short[0];
            accel[1] = (long)accel_short[1];
            accel[2] = (long)accel_short[2];

            (void)inv_build_accel(accel, 0, sensor_timestamp);
            new_data = 1;
        }
        else if (m_motion.dmp_on)
        {
            short gyro[3], accel_short[3], sensors;
            unsigned char more;
            long accel[3], quat[4], temperature;
            /* This function gets new data from the FIFO when the DMP is in
             * use. The FIFO can contain any combination of gyro, accel,
             * quaternion, and gesture data. The sensors parameter tells the
             * caller which data fields were actually populated with new data.
             * For example, if sensors == (INV_XYZ_GYRO | INV_WXYZ_QUAT), then
             * the FIFO isn't being filled with accel data.
             * The driver parses the gesture data to determine if a gesture
             * event has occurred; on an event, the application will be notified
             * via a callback (assuming that a callback function was properly
             * registered). The more parameter is non-zero if there are
             * leftover packets in the FIFO.
             */
            (void)dmp_read_fifo(gyro, accel_short, quat, &sensor_timestamp, &sensors, &more);

            if (more)
            {
                more_todo = true;
                NRF_LOG_DEBUG("mpulib_data_handler: more_todo\r\n");
            }

            if (sensors & INV_XYZ_GYRO) {
                /* Push the new data to the MPL. */
                (void)inv_build_gyro(gyro, sensor_timestamp);
                new_data = 1;
                if (m_motion.do_temp) {
                    m_motion.do_temp = 0;
                    /* Temperature only used for gyro temp comp. */
                    (void)mpu_get_temperature(&temperature, &sensor_timestamp);
                    (void)inv_build_temp(temperature, sensor_timestamp);
                }
            }
            
            if (sensors & INV_XYZ_ACCEL) {
                accel[0] = (long)accel_short[0];
                accel[1] = (long)accel_short[1];
                accel[2] = (long)accel_short[2];
                (void)inv_build_accel(accel, 0, sensor_timestamp);
                new_data = 1;
            }
            
            if (sensors & INV_WXYZ_QUAT) {
                (void)inv_build_quat(quat, 0, sensor_timestamp);
                new_data = 1;
            }
        }
        else
        {
            short gyro[3], accel_short[3];
            unsigned char sensors, more;
            long accel[3], temperature;
            /* This function gets new data from the FIFO. The FIFO can contain
             * gyro, accel, both, or neither. The sensors parameter tells the
             * caller which data fields were actually populated with new data.
             * For example, if sensors == INV_XYZ_GYRO, then the FIFO isn't
             * being filled with accel data. The more parameter is non-zero if
             * there are leftover packets in the FIFO. The HAL can use this
             * information to increase the frequency at which this function is
             * called.
             */

            (void)mpu_read_fifo(gyro, accel_short, &sensor_timestamp, &sensors, &more);

            if (more)
            {
                more_todo = true;
                NRF_LOG_DEBUG("mpulib_data_handler: more_todo\r\n");
            }

            if (sensors & INV_XYZ_GYRO)
            {
                /* Push the new data to the MPL. */
                (void)inv_build_gyro(gyro, sensor_timestamp);
                new_data = 1;
                if (m_motion.do_temp)
                {
                    m_motion.do_temp = 0;
                    /* Temperature only used for gyro temp comp. */
                    (void)mpu_get_temperature(&temperature, &sensor_timestamp);
                    (void)inv_build_temp(temperature, sensor_timestamp);
                }
            }
            
            if (sensors & INV_XYZ_ACCEL)
            {
                accel[0] = (long)accel_short[0];
                accel[1] = (long)accel_short[1];
                accel[2] = (long)accel_short[2];
                (void)inv_build_accel(accel, 0, sensor_timestamp);
                new_data = 1;
            }
        }

        if (m_motion.do_compass)
        {
            short compass_short[3];
            long compass[3];
            m_motion.do_compass = 0;
            /* For any MPU device with an AKM on the auxiliary I2C bus, the raw
             * magnetometer registers are copied to special gyro registers.
             */
            if (!mpu_get_compass_reg(compass_short, &sensor_timestamp))
            {
                compass[0] = (long)compass_short[0];
                compass[1] = (long)compass_short[1];
                compass[2] = (long)compass_short[2];
                /* NOTE: If using a third-party compass calibration library,
                 * pass in the compass data in uT * 2^16 and set the second
                 * parameter to INV_CALIBRATED | acc, where acc is the
                 * accuracy from 0 to 3.
                 */
                (void)inv_build_compass(compass, 0, sensor_timestamp);
            }
            new_data = 1;
        }

        if (new_data) {
            (void)inv_execute_on_data();
            mpulib_data_send();
        }
    }while (more_todo == true);
}


static void mpulib_data_handler_cb(void)
{
    mpulib_data_handler(0, 0);
}


static void mpulib_tap_cb(unsigned char direction, unsigned char count)
{
    if (m_motion.features & DRV_MOTION_FEATURE_MASK_TAP)
    {
        drv_motion_evt_t evt     = DRV_MOTION_EVT_TAP;
        uint8_t          data[2] = {direction, count};

        m_motion.evt_handler(&evt, data, sizeof(data));
    }

    #ifdef MOTION_DEBUG
        switch (direction)
        {
            case TAP_X_UP:
                NRF_LOG_DEBUG("drv_motion: tap x+ ");
                break;        
            case TAP_X_DOWN:  
                NRF_LOG_DEBUG("drv_motion: tap x- ");
                break;        
            case TAP_Y_UP:    
                NRF_LOG_DEBUG("drv_motion: tap y+ ");
                break;        
            case TAP_Y_DOWN:  
                NRF_LOG_DEBUG("drv_motion: tap y- ");
                break;        
            case TAP_Z_UP:    
                NRF_LOG_DEBUG("drv_motion: tap z+ ");
                break;        
            case TAP_Z_DOWN:  
                NRF_LOG_DEBUG("drv_motion: tap z- ");
                break;
            default:
                return;
        }

        NRF_LOG_DEBUG("x%d\r\n", count);
    #endif
}


static void mpulib_orient_cb(unsigned char orientation)
{
    if (m_motion.features & DRV_MOTION_FEATURE_MASK_ORIENTATION)
    {
        drv_motion_evt_t evt     = DRV_MOTION_EVT_ORIENTATION;

        m_motion.evt_handler(&evt, &orientation, 1);
    }

    #ifdef MOTION_DEBUG
        switch (orientation)
        {
            case ANDROID_ORIENT_PORTRAIT:
                NRF_LOG_DEBUG("Portrait\r\n");
                break;
            case ANDROID_ORIENT_LANDSCAPE:
                NRF_LOG_DEBUG("Landscape\r\n");
                break;
            case ANDROID_ORIENT_REVERSE_PORTRAIT:
                NRF_LOG_DEBUG("Reverse Portrait\r\n");
                break;
            case ANDROID_ORIENT_REVERSE_LANDSCAPE:
                NRF_LOG_DEBUG("Reverse Landscape\r\n");
                break;
            default:
                return;
        }
    #endif
}


static uint32_t mpulib_init(void)
{
    inv_error_t err_code;
    struct int_param_s int_param;

    int_param.cb = mpulib_data_handler_cb;

    err_code = mpu_init(&int_param);
    RETURN_IF_ERROR(err_code);

    err_code = inv_init_mpl();
    RETURN_IF_ERROR(err_code);

    /* This algorithm updates the accel biases when in motion. A more accurate
     * bias measurement can be made when running the self-test. */
    err_code = inv_enable_in_use_auto_calibration();
    RETURN_IF_ERROR(err_code);
    
    /* Compute 6-axis and 9-axis quaternions. */
    err_code = inv_enable_quaternion();
    RETURN_IF_ERROR(err_code);
    
    err_code = inv_enable_9x_sensor_fusion();
    RETURN_IF_ERROR(err_code);
    
    /* Update gyro biases when not in motion. */
    err_code = inv_enable_fast_nomot();
    RETURN_IF_ERROR(err_code);
    
    /* Update gyro biases when temperature changes. */
    err_code = inv_enable_gyro_tc();
    RETURN_IF_ERROR(err_code);
    
    /* Set the default compass bias to compensate for hard iron effects.
    1 places a low level on trust on the compass.
    The value will vary between Thingys, but this will provide some hard iron correction. */
    inv_set_compass_bias(COMPASS_BIAS, 1);
    
    #if NRF_LOG_ENABLED
        print_sensor_status();
    #endif
    
    /* Compass calibration algorithms. */
    err_code = inv_enable_vector_compass_cal();
    RETURN_IF_ERROR(err_code);
    
    err_code = inv_enable_magnetic_disturbance();
    RETURN_IF_ERROR(err_code);
    
    /* Allows use of the MPL APIs in read_from_mpl. */
    err_code = inv_enable_eMPL_outputs();
    RETURN_IF_ERROR(err_code);
    
    err_code = inv_enable_heading_from_gyro();
    RETURN_IF_ERROR(err_code);
    
    err_code = inv_start_mpl();
    RETURN_IF_ERROR(err_code);

    return NRF_SUCCESS;
}


static uint32_t mpulib_config(void)
{
    int             err_code;
    unsigned char   accel_fsr;
    unsigned short  gyro_rate;
    unsigned short  gyro_fsr;
    unsigned short  compass_fsr;

    err_code = mpu_set_sensors(m_motion.sensors);
    RETURN_IF_ERROR(err_code);

    /* Push both gyro, accel and compass data into the FIFO. */
    err_code = mpu_configure_fifo(m_motion.sensors);
    RETURN_IF_ERROR(err_code);
    
    err_code = mpu_set_sample_rate(m_motion.motion_freq_hz);
    RETURN_IF_ERROR(err_code);

    /* The compass sampling rate can be less than the gyro/accel sampling rate.
     * Use this function for proper power management. */
    err_code = mpu_set_compass_sample_rate(1000UL / m_motion.compass_interval_ms);
    RETURN_IF_ERROR(err_code);

    /* Read back configuration in case it was set improperly. */
    err_code = mpu_get_sample_rate(&gyro_rate);
    RETURN_IF_ERROR(err_code);
    
    err_code = mpu_get_gyro_fsr(&gyro_fsr);
    RETURN_IF_ERROR(err_code);
    
    err_code = mpu_get_accel_fsr(&accel_fsr);
    RETURN_IF_ERROR(err_code);
    
    err_code = mpu_get_compass_fsr(&compass_fsr);
    RETURN_IF_ERROR(err_code);

    /* Sync driver configuration with MPL. */
    /* Sample rate expected in microseconds. */
    inv_set_gyro_sample_rate(1000000L / gyro_rate);
    inv_set_accel_sample_rate(1000000L / gyro_rate);

    /* The compass rate is independent of the gyro and accel rates. As long as
     * inv_set_compass_sample_rate is called with the correct value, the 9-axis
     * fusion algorithm's compass correction gain will work properly. */
    inv_set_compass_sample_rate(m_motion.compass_interval_ms * 1000L);

    /* Set chip-to-body orientation matrix.
     * Set hardware units to dps/g's/degrees scaling factor. */
    inv_set_gyro_orientation_and_scale(
            inv_orientation_matrix_to_scalar(s_gyro_pdata.orientation),
            (long)gyro_fsr<<15);
    inv_set_accel_orientation_and_scale(
            inv_orientation_matrix_to_scalar(s_accel_pdata.orientation),
            (long)accel_fsr<<15);
    inv_set_compass_orientation_and_scale(
            inv_orientation_matrix_to_scalar(s_compass_pdata.orientation),
            (long)compass_fsr<<15);

    return NRF_SUCCESS;
}


static uint32_t dmp_init(void)
{
    int err_code;
    /* Initialize DMP. */
    err_code = dmp_load_motion_driver_firmware();
    RETURN_IF_ERROR(err_code);
    
    err_code = dmp_set_orientation(
        inv_orientation_matrix_to_scalar(s_gyro_pdata.orientation));
    RETURN_IF_ERROR(err_code);
    
    err_code = dmp_register_tap_cb(mpulib_tap_cb);
    RETURN_IF_ERROR(err_code);
    
    err_code = dmp_register_android_orient_cb(mpulib_orient_cb);
    RETURN_IF_ERROR(err_code);

    m_motion.dmp_features = DMP_FEATURE_6X_LP_QUAT | DMP_FEATURE_TAP |
        DMP_FEATURE_ANDROID_ORIENT | DMP_FEATURE_SEND_RAW_ACCEL | DMP_FEATURE_SEND_CAL_GYRO |
        DMP_FEATURE_GYRO_CAL;
    err_code = dmp_enable_feature(m_motion.dmp_features);
    RETURN_IF_ERROR(err_code);
    
    err_code = dmp_set_fifo_rate(m_motion.motion_freq_hz);
    RETURN_IF_ERROR(err_code);
    
    err_code = mpu_set_dmp_state(1);
    RETURN_IF_ERROR(err_code);

    return NRF_SUCCESS;
}


static uint32_t mpu9250_power(bool enable)
{
    uint32_t err_code;

    if (enable)
    {
        #if defined(THINGY_HW_v0_7_0)
            err_code = drv_ext_gpio_pin_clear(SX_MPU_PWR_CTRL);
        #elif defined(THINGY_HW_v0_8_0)
            err_code = drv_ext_gpio_pin_clear(SX_MPU_PWR_CTRL);
        #elif defined(THINGY_HW_v0_9_0)
            err_code = drv_ext_gpio_pin_clear(SX_MPU_PWR_CTRL);
        #else
            err_code = drv_ext_gpio_pin_set(SX_MPU_PWR_CTRL);
        #endif
        RETURN_IF_ERROR(err_code);
    }
    else
    {
        #if defined(THINGY_HW_v0_7_0)
            err_code = drv_ext_gpio_pin_set(SX_MPU_PWR_CTRL);
        #elif defined(THINGY_HW_v0_8_0)
            err_code = drv_ext_gpio_pin_set(SX_MPU_PWR_CTRL);
        #elif defined(THINGY_HW_v0_9_0)
            err_code = drv_ext_gpio_pin_set(SX_MPU_PWR_CTRL);
        #else
            err_code = drv_ext_gpio_pin_clear(SX_MPU_PWR_CTRL);
        #endif
        RETURN_IF_ERROR(err_code);
    }

    return NRF_SUCCESS;
}


/**@brief Function for handling temperature timer timeout event.
 */
static void temp_timeout_handler(void * p_context)
{
    m_motion.do_temp = true;
}


/**@brief Function for handling compass timer timeout event.
 */
static void compass_timeout_handler(void * p_context)
{
    m_motion.do_compass = true;
}


/**@brief Function for handling pedometer timer timeout event.
 */
static void pedo_timeout_handler(void * p_context)
{
    m_motion.do_pedo = true;
}


uint32_t drv_motion_enable(drv_motion_feature_mask_t feature_mask)
{
    uint32_t err_code;

    if ( (feature_mask & ~(DRV_MOTION_FEATURE_MASK)) ||
         (feature_mask == 0) )
    {
        return NRF_ERROR_INVALID_PARAM;
    }

    /* Set features bits. */
    m_motion.features |= feature_mask;
    /* Set enabled sensors. */
    m_motion.sensors |= (INV_XYZ_GYRO | INV_XYZ_ACCEL | INV_XYZ_COMPASS );

    if (!m_motion.running)
    {
        m_motion.running = true;

        err_code = mpu9250_power(true);
        APP_ERROR_CHECK(err_code);

        nrf_delay_ms(20);

        m_motion.dmp_on = true;
        err_code = mpulib_init();
        RETURN_IF_ERROR(err_code);
        err_code = mpulib_config();
        RETURN_IF_ERROR(err_code);
        err_code = dmp_init();
        RETURN_IF_ERROR(err_code);

        (void)drv_mpu9250_enable(true);

        err_code = app_timer_start(m_temp_timer_id,
                                   APP_TIMER_TICKS(m_motion.temp_interval_ms),
                                   NULL);
        RETURN_IF_ERROR(err_code);

        err_code = app_timer_start(m_compass_timer_id,
                                   APP_TIMER_TICKS(m_motion.compass_interval_ms),
                                   NULL);
        RETURN_IF_ERROR(err_code);

        err_code = app_timer_start(m_pedo_timer_id,
                                   APP_TIMER_TICKS(m_motion.pedo_interval_ms),
                                   NULL);
        RETURN_IF_ERROR(err_code);
    }

    return NRF_SUCCESS;
}


uint32_t drv_motion_disable(drv_motion_feature_mask_t feature_mask)
{
    uint32_t err_code;

    if ( (feature_mask & ~(DRV_MOTION_FEATURE_MASK)) ||
         (feature_mask == 0) )
    {
        return NRF_ERROR_INVALID_PARAM;
    }

    /* Clear feature bits. */
    m_motion.features &= ~feature_mask;

    if (!m_motion.features)
    {
        (void)drv_mpu9250_enable(false);

        err_code = mpu9250_power(false);
        RETURN_IF_ERROR(err_code);

        m_motion.running = false;

        err_code = app_timer_stop(m_temp_timer_id);
        RETURN_IF_ERROR(err_code);
        err_code = app_timer_stop(m_compass_timer_id);
        RETURN_IF_ERROR(err_code);
        err_code = app_timer_stop(m_pedo_timer_id);
        RETURN_IF_ERROR(err_code);
    }

    return NRF_SUCCESS;
}


uint32_t drv_motion_config(drv_motion_cfg_t * p_cfg)
{
    uint32_t err_code;

    NULL_PARAM_CHECK(p_cfg);

    m_motion.pedo_interval_ms      = p_cfg->pedo_interval_ms;
    m_motion.temp_interval_ms      = p_cfg->temp_interval_ms;
    m_motion.compass_interval_ms   = p_cfg->compass_interval_ms;
    m_motion.motion_freq_hz        = p_cfg->motion_freq_hz;
    m_motion.wake_on_motion        = p_cfg->wake_on_motion;
    m_motion.impact_threshold      = p_cfg->impact_threshold;

    if (m_motion.running)
    {
        drv_motion_feature_mask_t enabled_features = m_motion.features;

        err_code = drv_motion_disable(enabled_features);
        APP_ERROR_CHECK(err_code);
        return drv_motion_enable(enabled_features);
    }
    else
    {
        return NRF_SUCCESS;
    }
}


uint32_t drv_motion_sleep_prepare(bool wakeup)
{
    return drv_acc_wakeup_prepare(wakeup);
}


uint32_t drv_motion_init(drv_motion_evt_handler_t evt_handler, drv_motion_twi_init_t * p_twi_params_mpu, drv_motion_twi_init_t * p_twi_params_lis)
{
    uint32_t            err_code;
    drv_mpu9250_init_t  mpu_init_params;
    drv_acc_cfg_t       lis_init_params;

    NULL_PARAM_CHECK(evt_handler);

    NULL_PARAM_CHECK(p_twi_params_mpu);
    NULL_PARAM_CHECK(p_twi_params_mpu->p_twi_instance);

    NULL_PARAM_CHECK(p_twi_params_lis);
    NULL_PARAM_CHECK(p_twi_params_lis->p_twi_instance);

    lis_init_params.p_twi_instance = p_twi_params_lis->p_twi_instance;
    lis_init_params.p_twi_cfg      = p_twi_params_lis->p_twi_cfg;
    lis_init_params.twi_addr       = LIS2DH12_ADDR;
    lis_init_params.cpu_wake_pin   = LIS_INT1;

    mpu_init_params.p_twi_instance = p_twi_params_mpu->p_twi_instance;
    mpu_init_params.p_twi_cfg      = p_twi_params_mpu->p_twi_cfg;

    m_motion.evt_handler           = evt_handler;
    m_motion.features              = 0;
    m_motion.sensors               = 0;
    m_motion.dmp_features          = 0;
    m_motion.dmp_on                = false;
    m_motion.running               = false;
    m_motion.lp_accel_mode         = false;
    m_motion.do_temp               = false;
    m_motion.do_compass            = false;
    m_motion.do_pedo               = false;
    m_motion.pedo_interval_ms      = PEDO_READ_MS;
    m_motion.temp_interval_ms      = TEMP_READ_MS;
    m_motion.compass_interval_ms   = COMPASS_READ_MS;
    m_motion.motion_freq_hz        = DEFAULT_MPU_HZ;
    m_motion.wake_on_motion        = 1;
    m_motion.impact_threshold      = DEFAULT_IMP_THR;

    m_impact.currentIndex          = 0;
    m_impact.previousAcceleration  = 0;
    m_impact.impact                = 0;
    m_impact_queue.entryIndex      = 0;
    m_impact_queue.exitIndex       = 0;
    m_impact_queue.size            = 0;
    m_impact_queue.type            = 0;

    err_code = drv_acc_init(&lis_init_params);
    RETURN_IF_ERROR(err_code);

    err_code = drv_mpu9250_init(&mpu_init_params);
    RETURN_IF_ERROR(err_code);

    /* Init power pin and power off the mpu9250 chip */
    err_code = drv_ext_gpio_cfg_output(SX_MPU_PWR_CTRL);
    RETURN_IF_ERROR(err_code);

    err_code = mpu9250_power(false);
    RETURN_IF_ERROR(err_code);

    /**@brief Init application timers */
    err_code = app_timer_create(&m_temp_timer_id, APP_TIMER_MODE_REPEATED, temp_timeout_handler);
    RETURN_IF_ERROR(err_code);

    err_code = app_timer_create(&m_compass_timer_id, APP_TIMER_MODE_REPEATED, compass_timeout_handler);
    RETURN_IF_ERROR(err_code);

    err_code = app_timer_create(&m_pedo_timer_id, APP_TIMER_MODE_REPEATED, pedo_timeout_handler);
    RETURN_IF_ERROR(err_code);

    return NRF_SUCCESS;
}


uint32_t drv_motion_enable_sonification(sonification_channel_t channel){

    drv_motion_enable(DRV_MOTION_FEATURE_MASK_SONIFICATION);

    drv_motion_sonification_set_channel(channel);

    ble_slow_advertising_set(SLEEP_MODE_DISABLE);

    m_sonification.center_freq_hz = SONIFICATION_FREQ_CENTER;
    m_sonification.duration       = 1000 / (m_motion.motion_freq_hz);
    m_sonification.stationary     = 0;

    drv_motion_sonification_set_volume(100);
    drv_motion_sonification_set_precision(0);

    drv_speaker_tone_start(m_sonification.center_freq_hz, m_sonification.duration, m_sonification.volume);
    drv_speaker_multi_tone_update(m_sonification.center_freq_hz, m_sonification.duration, m_sonification.volume);

    return NRF_SUCCESS;
}

uint32_t drv_motion_disable_sonification(){
    uint32_t err_code;

    drv_motion_disable(DRV_MOTION_FEATURE_MASK_SONIFICATION);

    drv_speaker_tone_start(m_sonification.center_freq_hz, 0, 0);

    ble_slow_advertising_set(SLEEP_MODE_ENABLE);

    return NRF_SUCCESS;
}

uint32_t drv_motion_sonification_set_channel(sonification_channel_t channel){
    m_sonification.channel = channel;

    switch(channel){
        case SONIFICATION_CHANNEL_ROLL:
        case SONIFICATION_CHANNEL_PITCH:
        case SONIFICATION_CHANNEL_YAW:
            m_sonification.sensor = SONIFICATION_SENSOR_EULER;
            break;
        case SONIFICATION_CHANNEL_RAW_ACCEL_X:
        case SONIFICATION_CHANNEL_RAW_ACCEL_Y:
        case SONIFICATION_CHANNEL_RAW_ACCEL_Z:
            m_sonification.sensor = SONIFICATION_SENSOR_RAW_ACCEL;
            break;
        case SONIFICATION_CHANNEL_RAW_GYRO_X:
        case SONIFICATION_CHANNEL_RAW_GYRO_Y:
        case SONIFICATION_CHANNEL_RAW_GYRO_Z:
            m_sonification.sensor = SONIFICATION_SENSOR_RAW_GYRO;
            break;
        default:
            //Do nothing
            break;
    }

    return NRF_SUCCESS;
}

uint32_t drv_motion_sonification_set_precision(bool high){
    m_sonification.precision = high;

    return NRF_SUCCESS;
}

uint32_t drv_motion_sonification_set_volume(uint16_t volume){
    m_sonification.volume = volume;

    return NRF_SUCCESS;
}

float drv_motion_read_impact_acceleration(int8_t *accuracy, inv_time_t *timestamp){
    int32_t data[3];
    float current_acceleration = 0;
    if (inv_get_sensor_type_accel((long *)&data, accuracy, timestamp)){
        m_impact.acc_x[m_impact.currentIndex] = data[0] >> RAW_Q_FORMAT_ACC_INTEGER_BITS;
        m_impact.acc_y[m_impact.currentIndex] = data[1] >> RAW_Q_FORMAT_ACC_INTEGER_BITS;
        m_impact.acc_z[m_impact.currentIndex] = data[2] >> RAW_Q_FORMAT_ACC_INTEGER_BITS;
        current_acceleration += (float)(data[0]) / RAW_Q_FORMAT_INTEGER_BITS * (float)(data[0]) / RAW_Q_FORMAT_INTEGER_BITS;
        current_acceleration += (float)(data[1]) / RAW_Q_FORMAT_INTEGER_BITS * (float)(data[1]) / RAW_Q_FORMAT_INTEGER_BITS;
        current_acceleration += (float)(data[2]) / RAW_Q_FORMAT_INTEGER_BITS * (float)(data[2]) / RAW_Q_FORMAT_INTEGER_BITS;
    } else{
        m_impact.acc_x[m_impact.currentIndex] = 0;
        m_impact.acc_y[m_impact.currentIndex] = 0;
        m_impact.acc_z[m_impact.currentIndex] = 0;
    }
    return current_acceleration;
}

uint32_t drv_motion_read_impact_gyroscope(int8_t *accuracy, inv_time_t *timestamp){
    int32_t data[3];
    if (inv_get_sensor_type_gyro((long *)&data, accuracy, timestamp)){
        m_impact.gyro_x[m_impact.currentIndex] = data[0] >> RAW_Q_FORMAT_GYR_INTEGER_BITS;
        m_impact.gyro_y[m_impact.currentIndex] = data[1] >> RAW_Q_FORMAT_GYR_INTEGER_BITS;
        m_impact.gyro_z[m_impact.currentIndex] = data[2] >> RAW_Q_FORMAT_GYR_INTEGER_BITS;
    } else{
        m_impact.gyro_x[m_impact.currentIndex] = 0;
        m_impact.gyro_y[m_impact.currentIndex] = 0;
        m_impact.gyro_z[m_impact.currentIndex] = 0;
    }
    return NRF_SUCCESS;
}

uint32_t drv_motion_read_impact_euler(int8_t *accuracy, inv_time_t *timestamp){
    int32_t data[3];
    if (inv_get_sensor_type_euler((long *)data, accuracy, timestamp)){
        m_impact.roll[m_impact.currentIndex]  = data[0];
        m_impact.pitch[m_impact.currentIndex] = data[1];
        m_impact.yaw[m_impact.currentIndex]   = data[2];
    } else{
        m_impact.roll[m_impact.currentIndex]  = 0;
        m_impact.pitch[m_impact.currentIndex] = 0;
        m_impact.yaw[m_impact.currentIndex]   = 0;
    }
    return NRF_SUCCESS;
}

uint32_t drv_motion_queue_add(int16_t value){
    m_impact_queue.size++;
    m_impact_queue.data[m_impact_queue.entryIndex] = value;
    m_impact_queue.entryIndex++;
    m_impact_queue.entryIndex %= MAX_QUEUE_SIZE;

    return NRF_SUCCESS;
}

uint32_t drv_motion_queue_add_acceleration(){
    drv_motion_queue_add(m_impact.acc_x[m_impact.writeIndex]);
    drv_motion_queue_add(m_impact.acc_y[m_impact.writeIndex]);
    drv_motion_queue_add(m_impact.acc_z[m_impact.writeIndex]);

    return NRF_SUCCESS;
}

uint32_t drv_motion_queue_add_gyroscope(){
    drv_motion_queue_add(m_impact.gyro_x[m_impact.writeIndex]);
    drv_motion_queue_add(m_impact.gyro_y[m_impact.writeIndex]);
    drv_motion_queue_add(m_impact.gyro_z[m_impact.writeIndex]);

    return NRF_SUCCESS;
}

uint32_t drv_motion_queue_add_euler(){
    int16_t ms, ls;
    ms = m_impact.roll[m_impact.writeIndex] / RAW_Q_FORMAT_INTEGER_BITS;
    ls = (int16_t)m_impact.roll[m_impact.writeIndex];
    drv_motion_queue_add(ms);
    drv_motion_queue_add(ls);
    ms = m_impact.pitch[m_impact.writeIndex] / RAW_Q_FORMAT_INTEGER_BITS;
    ls = (int16_t)m_impact.pitch[m_impact.writeIndex];
    drv_motion_queue_add(ms);
    drv_motion_queue_add(ls);
    ms = m_impact.yaw[m_impact.writeIndex] / RAW_Q_FORMAT_INTEGER_BITS;
    ls = (int16_t)m_impact.yaw[m_impact.writeIndex];
    drv_motion_queue_add(ms);
    drv_motion_queue_add(ls);

    return NRF_SUCCESS;
}

int16_t drv_motion_dequeue(){
    if (m_impact_queue.size <= 0){
        return 0;
    }

    m_impact_queue.size--;
    int16_t data = m_impact_queue.data[m_impact_queue.exitIndex];
    m_impact_queue.exitIndex++;
    m_impact_queue.exitIndex %= MAX_QUEUE_SIZE;
    return data;
}