A = im2double(imread("App (11).jpeg"));
B = im2double(imread("App (13).jpeg"));
C = mergePhotos(A, B, 0, 30, 0);

%%
imwrite(C, "App_Motion.jpeg");
