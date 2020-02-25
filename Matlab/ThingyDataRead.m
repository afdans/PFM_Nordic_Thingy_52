clear all;
close all;
clc;
%%
addpath('C:\xampp\htdocs\datafiles');
motionValues = importdata('dataMotion.csv');
motionData = motionValues.data;
acceleration = motionData(1 : 3, :);
gyroscope = motionData(4 : 6, :);
motionTime = motionData(end, :);