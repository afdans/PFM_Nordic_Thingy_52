function dataDistribution(Acc)
    binWidth= 0.0009765625;
    X = Acc(:, 1);
    Y = Acc(:, 2);
    Z = Acc(:, 3);
    
    means = mean(Acc);
    stds = std(Acc);
    
    figure()
    subplot(2, 2, 1)
    plot(Acc);
    legend('X', 'Y', 'Z');
    
    subplot(2, 2, 2)
    histogram(X, 'BinWidth', binWidth, 'Normalization', 'Probability');
    legend('X')
    title({['Mean value: ', num2str(means(1))], ['Standard deviation: ', num2str(stds(1))]});
    
    subplot(2, 2, 3)
    histogram(Y, 'BinWidth', binWidth, 'Normalization', 'Probability', 'FaceColor', [0.8500 0.3250 0.0980]);
    legend('Y')
    title({['Mean value: ', num2str(means(2))], ['Standard deviation: ', num2str(stds(2))]});
    
    subplot(2, 2, 4)
    histogram(Z, 'BinWidth', binWidth, 'Normalization', 'Probability', 'FaceColor', [0.9290 0.6940 0.1250]);
    legend('Z')
    title({['Mean value: ', num2str(means(3))], ['Standard deviation: ', num2str(stds(3))]});
end