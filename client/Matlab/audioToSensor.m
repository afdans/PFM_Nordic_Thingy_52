function [sensorValues, peakValues] = audioToSensor(filename, spectro, peaks, options)

MIN_HARMONIC_FREQ = 100;
MAX_HARMONIC_FREQ = 1200;
CENTRAL_FREQUENCY = 1000;
HZ_TO_KHZ = 1000;
TAIL_SECS = 0.3;
peakValues = 0;

[signal, fs] = audioread(filename);

m = length(signal); % original sample length
signal = signal(1 : end);

if options.plots
    t = (0 : m - 1)/ fs; figure; plot(t, signal); xlabel('Time [sec]');
end

if options.clipping
    tail_samples = fs * TAIL_SECS;
    [max_value, max_index] = max(signal(1 : (m / 2)));
    clipped_signal = signal(max_index + tail_samples : end);
    [max_value_end, end_index] = max(clipped_signal);

    if (0.8 * max_value < max_value_end)
        clipped_signal = clipped_signal(1 : end_index - tail_samples);
    end
    m = length(clipped_signal); % new sample length
    if options.plots
        t = (0 : m - 1)/ fs; figure; plot(t, clipped_signal); xlabel('Time [sec]');
    end
else
    clipped_signal = signal;
end

if (m / fs) >= 60
    time_conversion = 60;
else
    time_conversion = 1;
end

window = hamming(spectro.window); %%window with size of 512 points
noverlap = spectro.overlap; %%the number of points for repeating the window
nfft = round(fs / spectro.resolution); %%size of the fit
[~, f, t, p] = spectrogram(clipped_signal, window, noverlap, nfft, fs, 'yaxis');
freq_range = round(MIN_HARMONIC_FREQ / spectro.resolution : MAX_HARMONIC_FREQ / spectro.resolution);
[fridge, ~, lr] = tfridge(p(freq_range, :), f(freq_range));

if options.plots
    figure;
    spectrogram(clipped_signal, window, noverlap, nfft, fs, 'yaxis');
    figure;
    spectrogram(clipped_signal, window, noverlap, nfft, fs, 'yaxis');
    hold on
    plot3(t / time_conversion, fridge / HZ_TO_KHZ, abs(p(lr)), 'LineWidth', 4)
    hold off
end

if options.plots
    figure; plot(t / time_conversion, fridge); xlabel('Time [sec]'); ylabel('Freq [Hz]');
end

sensorValues = fridge - CENTRAL_FREQUENCY;
sensorValues = sensorValues / 120;

if options.plots
    figure; plot(t / time_conversion, sensorValues); xlabel('Time [sec]'); ylabel('Acceleration [Gs]');
end

if peaks.calc
    Fs = 1 / t(1);
    [pks, lcs] = findpeaks(sensorValues, Fs, 'MinPeakDistance', peaks.distance, 'MinPeakHeight', peaks.height, 'MinPeakProminence', peaks.prominence);
    peakValues = [pks.'; (lcs * Fs).'];
    %if options.plots
        figure;
        findpeaks(sensorValues, Fs, 'MinPeakDistance', peaks.distance, 'MinPeakHeight', peaks.height, 'MinPeakProminence', peaks.prominence);
        xlabel("Time [s]")
        ylabel("Acceleration [G]")
    %end
end