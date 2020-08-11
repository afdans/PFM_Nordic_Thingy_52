function new_image = mergePhotos(upper, lower, range, scroller, threshold)

if isstring(upper)
    A = im2double(imread(upper));
else
    A = im2double(upper);
end

if isstring(lower)
    B = im2double(imread(lower));
else
    B = im2double(lower);
end

if range == 0
    range = 100;
end

if threshold == 0
    threshold = 5e-6;
end

[m, n, ~] = size(lower);

n = n - scroller;

lines = A(end - range : end, 1 : n, :);

for i = 1 : m - range
    x = B(i : i + range, 1 : n, :);
    C = x - lines;
    diff = sum(sum(sum(abs(C))));
    relative = diff / ((range + 1) * 255 * 3 * n);
    if relative < threshold
        break;
    end
end

new_image = [A ; B(i + range : end, :, :)];
end