# LambdaNetCLI

Steps to run a prediction on this command line :

1) Clone this repository.
2) Download and Unzip https://drive.google.com/file/d/1NvEVQ4-5tC3Nc-Mzpu3vYeyEcaM_zEgV/view?usp=sharing (model) and https://drive.google.com/file/d/1ZhsUf9bUzT3ZJB0KzNP6w2aj3sQZwtsp/view?usp=sharing (data). Have the Unzipped folders in same directory.
3) Run on command line the command "gradlew createJar" on this project cloned root directory.
4) Run on command line java -jar LambdaNetCLI-all-1.0-SNAPSHOT.jar $parameter1 $parameter2 $parameter3 on this project root\build\libs directory. Where $parameter1 - unzipped directory of model and data, $parameter2 - directory of compiled parsingFromFile.ts i.e, parsingFromFile.js, $parameter3 - Directory of project which is to be predicted.


#Result

The result shows file name, line number and character location where the top 5 prediction is done.

Example: 

=== File: src/ex1-typing.ts ===
(3,6)-(3,11): [1](99.67%) Object, [2](0.03%) Map, [3](0.03%) Promise, [4](0.02%) Function, [5](0.02%) Partial

exaplanation - File - ex1-typing.ts line - 3 characters - 6 to 11, and top 5 prediction. And it predicts in the file ex1-typing.ts on line 3 at characters 6 to 11 as 99.67% as Object, 0.03% Map, 0.03% Promise, 0.02% Function, 0.02% Partial type.




![LambdaNetCLIResult](https://user-images.githubusercontent.com/45932617/101178017-c2485e80-3648-11eb-9d58-1c2dafb5641a.png)
