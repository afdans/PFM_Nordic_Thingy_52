clear all;
close all;
%clc;
%%
addpath('C:\xampp\htdocs\PFM_Nordic_Thingy_52\client\datafiles');

axis = 'Y';
volume = '10';
sign   = 'N';

filename = strcat('Acc', axis, 'Vol', volume, sign, '.csv');

motionValues = importdata(filename);
motionData = motionValues.data;

%%

Acc(:, 1) = motionData(1, :).';
Acc(:, 2) = motionData(2, :).';
Acc(:, 3) = motionData(3, :).';

filename = strcat('Vol_', volume, '_Acc_', axis, '_', sign, '.mat');
save(filename, 'Acc');


%%

media = mean(Acc)
desviacion = std(Acc)

dataDistribution(Acc)
