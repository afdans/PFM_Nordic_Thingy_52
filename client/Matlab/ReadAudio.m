clear;
close all;
clc;

addpath('C:\xampp\htdocs\PFM_Nordic_Thingy_52\client\Recordings');

options = struct('plots', 1, 'clipping', 0);
spectro = struct('window', 128, 'overlap', 64, 'resolution', 1);
peaks   = struct('calc', 0, 'height', 1 , 'distance', 1.7, 'prominence', 3);


volume = ["60", "60", "100", "100"];
res = ["low", "high", "low", "high"];

filename_audio = strcat("5Hz_Beeping_No.wav");
sensorData = audioToSensor(filename_audio, spectro, peaks, options);
