clear all;
close all;
clc;
%%
addpath('C:\xampp\htdocs\datafiles');

motionValues = importdata('dataMotion.csv');
environmentValues = importdata('dataEnvironment.csv');
motionData = motionValues.data;
environmentData = environmentValues.data;