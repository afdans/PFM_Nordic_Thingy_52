clear;
close all;
clc;

[signal, fs] = audioread('100HzGyro.m4a');

sound = signal(3 * fs : end);

m = length(sound);     % original sample length
sec = m / fs;
time = 0 : 1 / fs : sec - 1 / fs;

figure;
plot(time, sound);

n = pow2(nextpow2(m)); % transform length
y = fft(sound , n);    % DFT of signal

f = (0 : n - 1) * (fs / n) / 10;
power = abs(y) .^ 2 / n;      

figure;
plot(f(1 : floor(n / 2)) , power(1 : floor(n  / 2)))
xlabel('Frequency')
ylabel('Power')