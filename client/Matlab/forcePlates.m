function acceleration = forcePlates(filename, freq, PLOT)

motionValues = importdata(filename);
force_plate = motionValues.data(:, 1) + motionValues.data(:, 2) + motionValues.data(:, 3);

% remove trailing zeros
iLast = find(force_plate, 1, 'last');
force_plate = force_plate(1 : iLast);

[pks, lcs] = findpeaks(force_plate, 1, 'MinPeakHeight', 700, 'MinPeakDistance', freq);
len = length(lcs);
leg = zeros(len, 1);
for i = 1 : len
    leg(i) = mean(force_plate(lcs(i) + (5 : freq / 2)));
end
acceleration = pks ./ leg;

if PLOT
    figure;
    findpeaks(force_plate, freq, 'MinPeakHeight', 700, 'MinPeakDistance', 1);
    xlabel('Time [s]');
    ylabel('Force [N]');
end