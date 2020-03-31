clear all;
close all;
clc;
%%
addpath('C:\xampp\htdocs\PFM_Nordic_Thingy_52\client\datafiles');

motionValues = importdata('dataMotion.csv');
environmentValues = importdata('dataEnvironment.csv');
motionData = motionValues.data;
environmentData = environmentValues.data;

%%

Acc_X = motionData(1, :);
Acc_Y = motionData(2, :);
Acc_Z = motionData(3, :);
Motion_T = datetime(motionData(end, :) / 1000, 'convertFrom', 'posixTime');

%%
figure();
plot(Motion_T, sqrt(Acc_X .^ 2 + Acc_Y .^ 2 + Acc_Z .^ 2));