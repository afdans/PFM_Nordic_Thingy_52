clear all;
close all;
clc;
%
addpath('C:\xampp\htdocs\PFM_Nordic_Thingy_52\client\datafiles');


volumes = [0 : 10 : 30 50];
axis = 'XYZ';
signs = 'PN';

m = length(volumes);
n = length(axis);
l = length(signs);

X_mean = zeros(m, n, l);
Y_mean = zeros(m, n, l);
Z_mean = zeros(m, n, l);

X_std = zeros(m, n, l);
Y_std = zeros(m, n, l);
Z_std = zeros(m, n, l);

for i = 1 : m
    for j = 1 : n
        for k = 1 : l
            filename_mat = strcat("Vol_", int2str(volumes(i)),"_Acc_", axis(j), "_", signs(k), ".mat");
            try
                load(filename_mat);
            catch
                clear Acc;
                filename_data = strcat('Vol', int2str(volumes(i)), axis(j), signs(k), '.csv');
                motionValues = importdata(filename_data);
                motionData = motionValues.data;

                Acc(:, 1) = motionData(1, :).';
                Acc(:, 2) = motionData(2, :).';
                Acc(:, 3) = motionData(3, :).';

                save(filename_mat, 'Acc');
            end
            means = mean(Acc);
            stds = std(Acc);
            X_mean(i, j, k) = means(1);
            Y_mean(i, j, k) = means(2);
            Z_mean(i, j, k) = means(3);
            X_std (i, j, k) = stds(1);
            Y_std (i, j, k) = stds(2);
            Z_std (i, j, k) = stds(3);
        end
    end
end

%
volumes = [0 : 10 : 30 50];

axis = 1 : 3;
direction = 1 : 2;

for i = axis
    for j = direction
        figure;

        x_m = X_mean(:, i, j);
        x_std = X_std(:, i, j);

        curve1 = x_m + x_std;
        curve2 = x_m - x_std;
        filling = [volumes fliplr(volumes)];
        inBetween = [curve1.', fliplr(curve2.')];
        s = fill(filling, inBetween, 'r');
        alpha(s, 0.5);
        hold on;
        plot(volumes, x_m, 'r', 'LineWidth', 2);

        y_m = Y_mean(:, i, j);
        y_std = Y_std(:, i, j);

        curve1 = y_m + y_std;
        curve2 = y_m - y_std;
        filling = [volumes fliplr(volumes)];
        inBetween = [curve1.', fliplr(curve2.')];
        s = fill(filling, inBetween, 'g');
        alpha(s, 0.5);
        hold on;
        plot(volumes, y_m, 'g', 'LineWidth', 2);

        z_m = Z_mean(:, i, j);
        z_std = Z_std(:, i, j);

        curve1 = z_m + z_std;
        curve2 = z_m - z_std;
        filling = [volumes fliplr(volumes)];
        inBetween = [curve1.', fliplr(curve2.')];
        s = fill(filling, inBetween, 'b');
        alpha(s, 0.5);
        hold on;
        plot(volumes, z_m, 'b', 'LineWidth', 2);

        grid on;

    end
end

%%

% figure;
% y = rand(1,10); % your mean vector;
% x = 1:numel(y);
% std_dev = 1;
% curve1 = y + std_dev;
% curve2 = y - std_dev;
% x2 = [x, fliplr(x)];
% inBetween = [curve1, fliplr(curve2)];
% fill(x2, inBetween, 'g');
% hold on;
% plot(x, y, 'r', 'LineWidth', 2);



