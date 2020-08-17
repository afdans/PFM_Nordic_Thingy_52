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
            %%dataDistribution(Acc);
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

volumes = [0 : 10 : 30 50];


%% Axis

std_axis = zeros(m, n);
std_axis(:, 1) = mean(mean(X_std, 3), 2);
std_axis(:, 2) = mean(mean(Y_std, 3), 2);
std_axis(:, 3) = mean(mean(Z_std, 3), 2);


figure;

h = plot(volumes, std_axis);
set(h,{'LineStyle'},{'-';'--';':'})
legend('X', 'Y', 'Z');
xlabel('Volume [%]');
ylabel('Standard deviation [Gs]');

%% Orientation

std_orienation = (X_std + Y_std + Z_std) ./ 3;

figure;

h = plot(volumes, std_orienation(:, : , 1), 'o');
set(h,{'LineStyle'},{'-'; '--'; ':'})
hold on;
h = plot(volumes, std_orienation(:, : , 2), 'x');
set(h,{'LineStyle'},{'-'; '--'; ':'})
legend('X Up', 'Y Up', 'Z Up', 'X Down', 'Y Down', 'Z Down');
xlabel('Volume [%]');
ylabel('Standard deviation [Gs]');


