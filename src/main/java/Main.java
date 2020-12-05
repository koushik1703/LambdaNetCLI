import lambdanet.JavaAPI$;
import lambdanet.TypeInferenceService;
import lambdanet.TypeInferenceService$;

public class Main {
    public static void main(String[] args) {
        var api = JavaAPI$.MODULE$;
        var typeInfer = TypeInferenceService$.MODULE$;

        // Model Configuring
        var modelPath = api.absPath(args[0]);
        var modelPathForUserDefined = api.joinPath(modelPath, "models/newParsing-GAT1-fc2-newSim-decay-6");
        var paramPath = api.joinPath(modelPathForUserDefined, "params.serialized");
        var modelCachePath = api.joinPath(modelPathForUserDefined, "model.serialized");
        var modelConfig = api.defaultModelConfig();
        var parsedReposPath = api.joinPath(modelPath, "data/parsedRepos");

        // Load Model
        var model = typeInfer.loadModel(paramPath, modelCachePath, modelConfig, 8, parsedReposPath);

        // Prediction Service
        var predService = api.predictionService(model, 8, 5);

        // Project Directory
        var projectDir = args[2];

        // Parsing from file Directory
        var parsingFromFileDir = args[1];

        try {
            assert !projectDir.strip().isEmpty() : "Specified path should not be empty."; // Check Directory is not empty

            var projectPath = api.absPath(projectDir);
            var parsingFromFilePath = api.absPath(parsingFromFileDir);
            String[] skipSet = {"node_modules"};

            var results = predService.predictOnProject(projectPath, true, skipSet, parsingFromFilePath); // Prediction on Project
            var predictionResults = new TypeInferenceService.PredictionResultsWithVariable(results, projectDir + "\\"); // Prediction Result Wrapping
            predictionResults.prettyPrint(); // Printing Result
        } catch (Throwable e) {
            System.out.println("Got exception: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
