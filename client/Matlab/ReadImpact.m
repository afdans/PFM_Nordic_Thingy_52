clear all;
close all;
clc;
%%
addpath('C:\xampp\htdocs\PFM_Nordic_Thingy_52\client\datafiles');

motionValues = importdata('Impact_test.csv');
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

%% Plots

figure();
plot(accImpactAbs);
hold on;
plot(freq  + 1, accImpactAbs(freq + 1, :), 'kx');
hold on;
plot(zeros(impactSamples, 1) + thld, 'k--');
xlim([1 impactSamples]);
