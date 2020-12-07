# LambdaNetCLI

A command line tool to get pre-trained model, data, parsingFromFile.js, project to predict directory as input and get the prediction on command line console.

Changes made in LambNet to make it support to take custom location of parsingFromFile.js(compiled parsingFromFile.ts) as input can be found here - https://github.com/MrVPlusOne/LambdaNet/compare/master...koushik1703:JetBrains_Task.



# Steps to run a prediction on this command line(On machine with Java11 and Node already installed) :

1) Clone this repository.


2) Run on command line the command "gradlew createJar" on this project cloned root directory. 


3) Run "sh installDependencies.sh"/ "installDependencies.bat" on linux and Mac/ Windows respectively in scripts/ts directory.


4) Download and Unzip https://drive.google.com/file/d/1NvEVQ4-5tC3Nc-Mzpu3vYeyEcaM_zEgV/view?usp=sharing (model) and https://drive.google.com/file/d/1ZhsUf9bUzT3ZJB0KzNP6w2aj3sQZwtsp/view?usp=sharing (data). Have the Unzipped folders in same directory.


5) Run on command line the command "java -jar LambdaNetCLI-all-1.0-SNAPSHOT.jar $parameter1 $parameter2 $parameter3" on this project root\build\libs directory. 

    Where,
    
        $parameter1 - Unzipped directory of model and data
        
        $parameter2 - Directory of compiled parsingFromFile.ts i.e, parsingFromFile.js
        
        $parameter3 - Directory of project which is to be predicted.



# Result

The result shows the variable/method name and Top 5 prediction for it, for every variable/method in every file.

Example: 

![LambdaNetCLIResult](https://user-images.githubusercontent.com/45932617/101231589-8fd04d00-36ac-11eb-82be-1ce4d9017cba.png)
