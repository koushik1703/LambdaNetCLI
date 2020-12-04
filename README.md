# LambdaNetCLI

Steps to run a prediction on this command line :

1) Clone this repository.
2) Download and Unzip https://drive.google.com/file/d/1NvEVQ4-5tC3Nc-Mzpu3vYeyEcaM_zEgV/view?usp=sharing (Model) and https://drive.google.com/file/d/1ZhsUf9bUzT3ZJB0KzNP6w2aj3sQZwtsp/view?usp=sharing (Parsed Repo). Have the Unzipped folder in same directory.
3) Run on command line the command gradlew createJar on this project cloned root directory.
4) Run on command line java -jar LambdaNetCLI-all-1.0-SNAPSHOT.jar $parameter1 $parameter2 $parameter3 on this project root\build\libs directory. Where $parameter1 - unzipped directory of model and Parsed Repo, $parameter2 - location of script directory which has compiled parsingFromFile.ts i.e, parsingFromFile.js, $parameter3 - Directory of project which is to be predicted.
