clear;
close all;
clc;

addpath('C:\xampp\htdocs\PFM_Nordic_Thingy_52\client\Recordings');
addpath('C:\xampp\htdocs\PFM_Nordic_Thingy_52\client\datafiles');

options = struct('plots', 0, 'clipping', 0);
spectro = struct('window', 128, 'overlap', 64, 'resolution', 1);
peaks   = struct('calc', 1, 'height', 1 , 'distance', 1.7, 'prominence', 3);


freq = [50, 200, 200, 200];
index = ["1", "3", "4", "5"];
volume = ["60", "60", "100", "100"];
res = ["low", "high", "low", "high"];
acc_plate = zeros(10, 4);
acc_sensor = zeros(10, 4);
for i = 1 : 4
    filename_plate = strcat("AFD_sonification0000", index(i), ".csv");
    acc_plate(:, i) = forcePlates(filename_plate, freq(i), 0);
    filename_audio = strcat("Steps_", volume(i), "_", res(i),".wav");
    [sensorData, peakData] = audioToSensor(filename_audio, spectro, peaks, options);
    acc_sensor(:, i) = peakData(1, :);
end

%%

clear all; load('plateTest.mat'); acc_plate = acc.plate; acc_sensor = acc.thingy;

figure;
t = 1 : 10;

for i = 1 : 4
    subplot(2, 2, i)
    plot(t, acc_plate(:, i), '--x', t, acc_sensor(:, i), ':o');
    xlabel('Stomp');
    ylabel('Acceleration [G]');
    legend('Force Plate', 'Thingy');
end