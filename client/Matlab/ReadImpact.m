clear;
clc;
%%
addpath('C:\xampp\htdocs\PFM_Nordic_Thingy_52\client\datafiles');

motionValues = importdata('Impact_boxing_low.csv');
motionData = motionValues.data;

accX = motionData(1, :);
accY = motionData(2, :);
accZ = motionData(3, :);

gyroX = motionData(4, :);
gyroY = motionData(5, :);
gyroZ = motionData(6, :);

roll  = motionData(10, :);
pitch = motionData(11, :);
yaw   = motionData(12, :);

Euler = [roll; pitch; yaw].';

freq = motionData(13, 1);
thld = motionData(14, 1);

accAbs = sqrt(accX .^ 2 + accY .^ 2 + accZ .^ 2);

%% Separate Impacts
windowDuration = 2;
impactSamples = windowDuration * freq + 1;
nImpacts = size(accX, 2) / impactSamples;

accImpactX = reshape(accX, [impactSamples, nImpacts]);
accImpactY = reshape(accY, [impactSamples, nImpacts]);
accImpactZ = reshape(accZ, [impactSamples, nImpacts]);

gyroImpactX = reshape(gyroX, [impactSamples, nImpacts]);
gyroImpactY = reshape(gyroY, [impactSamples, nImpacts]);
gyroImpactZ = reshape(gyroZ, [impactSamples, nImpacts]);

rollImpact  = reshape(roll,  [impactSamples, nImpacts]);
pitchImpact = reshape(pitch, [impactSamples, nImpacts]);
yawImpact   = reshape(yaw,   [impactSamples, nImpacts]);

accImpactAbs = reshape(accAbs, [impactSamples, nImpacts]);

time = -1 : 1 /freq : 1;

%% Plots
close all;
figure();
plot(time, accImpactAbs);
hold on;
plot(0, accImpactAbs(freq + 1, :), 'kx');
hold on;
plot(time, zeros(1, impactSamples) + thld, 'k--');
xlim([-1 1]);
ylabel('|Acceleration| [G]');
xlabel('Time [s]');
title('Total Acceleration');


figure();
sgtitle('Acceleration')
subplot(3, 1, 1)
plot(time, accImpactX);
ylabel('Acceleration [G]');
xlabel('Time [s]');
title('X');

subplot(3, 1, 2)
plot(time, accImpactY);
ylabel('Acceleration [G]');
xlabel('Time [s]');
title('Y');

subplot(3, 1, 3)
plot(time, accImpactZ);
ylabel('Acceleration [G]');
xlabel('Time [s]');
title('Z');

figure();
sgtitle('Rotation')
subplot(3, 1, 1)
plot(time, gyroImpactX);
ylabel('Rotation [deg / s]');
xlabel('Time [s]');
title('X');

subplot(3, 1, 2)
plot(time, gyroImpactY);
ylabel('Rotation [deg / s]');
xlabel('Time [s]');
title('Y');

subplot(3, 1, 3)
plot(time, gyroImpactZ);
ylabel('Rotation [deg / s]');
xlabel('Time [s]');
title('Z');

figure();
sgtitle('Euler Angles')
subplot(3, 1, 1)
plot(time, rollImpact);
ylabel('Angle [deg]');
xlabel('Time [s]');
title('Roll');

subplot(3, 1, 2)
plot(time, pitchImpact);
ylabel('Angle [deg]');
xlabel('Time [s]');
title('Pitch');

subplot(3, 1, 3)
plot(time, yawImpact);
ylabel('Angle [deg]');
xlabel('Time [s]');
title('Yaw');