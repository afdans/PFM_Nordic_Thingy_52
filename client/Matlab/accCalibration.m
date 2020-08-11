clear all;
close all;
clc;
%%
addpath('C:\xampp\htdocs\PFM_Nordic_Thingy_52\client\datafiles');
freq = 200;
secondsInMinute = 60;
axis = ['X'; 'Y'; 'Z'].';
sign = ['P'; 'N'].';

for i = 1 : 6
    currentAxis = axis(rem(i, 3) + 1);
    currentSign = sign(ceil(i / 3));
    filename = strcat('Vol0', currentAxis, currentSign, '.csv');

    if (currentSign == 'P')
        orientation = 'Up';
    else
        orientation = 'Down';
    end

    figureTitle = strcat('Calibration: ', currentAxis, '-', orientation);

    motionValues = importdata(filename);
    motionData = motionValues.data;

    Acc(:, 1) = motionData(1, :).';
    Acc(:, 2) = motionData(2, :).';
    Acc(:, 3) = motionData(3, :).';

    nSamples = size(Acc, 1);
    time = (0 : nSamples - 1) / freq / secondsInMinute;

    figure()
    plot(time, Acc);
    xlim([0, time(end)]);
    ylim([-1.1 1.1]);
    legend('X', 'Y', 'Z', 'Location', 'best');
    ylabel('Acceleration [Gs]');
    xlabel('Time [min]');
    title(figureTitle);
    clear Acc;
end
