//import prompt from '../assets/prompts/prompt_extractData.txt';

/*
function readFileToString(filePath) {
    
    
  
    return fileContent;
}*/

// Function to use the string data
function useStringData(stringData) {
    console.log("String data from file:");
    console.log(stringData);
    
    // You can perform further operations with the string data here
    // For example, you could parse it as JSON if it's valid JSON
    try {
      const jsonData = JSON.parse(stringData);
      console.log("Parsed JSON data:", jsonData);
    } catch (error) {
      console.error("Error parsing JSON:", error);
    }
}
  
// Main function to run the program
export const promptForFiles = () => {
    //const filePath = prompt; // Replace with your actual file path
    //const stringData = readFileToString();
    return useStringData(fileContent);
};

const fileContent = `Please extract the data in the format of Json.
**Return only Json Data.**

#Example
{
  "document_info": {
    "source": "Solfie_Vrs.8.1.0_Alpha - Solfie (       ) - 2024-10-18  13-27.pdf",
    "software_version": "TimeWaver Pro 4.20.23.1249",
    "generation_date": "2024-10-18",
    "generation_time": "13:29:48"
  },
  "harmonization_plan": {
    "start_date": "2024-10-18 13:27:59",
    "end_date": "2024-11-15 13:27:59",
    "duration": "7d 12h 19m",
    "interval": "5m 59s"
  },
  "focus": "Present state",
  "harmonization_list": [
    {"index": 1, "consciousness": 97, "value": 46, "db_path": "01-01-46"},
    {"index": 2, "consciousness": 97, "value": 45, "db_path": "01-02-45"},
    {"index": 3, "consciousness": 90, "value": 31, "db_path": "01-03-31"},
    {"index": 4, "consciousness": -97, "value": 99, "db_path": "02-01-99"},
    {"index": 5, "consciousness": -94, "value": 48, "db_path": "02-02-48"},
    {"index": 6, "consciousness": -91, "value": 14, "db_path": "02-03-14"},
    {"index": 7, "consciousness": -88, "value": 3, "db_path": "03-01-12"},
    {"index": 8, "consciousness": 85, "value": 4, "db_path": "03-02-05"},
    {"index": 9, "consciousness": -66, "value": 1, "db_path": "03-03-01-10"},
    {"index": 10, "consciousness": 90, "value": 27, "db_path": "03-03-02-28"},
    {"index": 11, "consciousness": 84, "value": 8, "db_path": "03-03-03-09"},
    {"index": 12, "consciousness": 79, "value": 0, "db_path": "03-03-04-01"},
    {"index": 13, "consciousness": 90, "value": 35, "db_path": "03-03-05-36"},
    {"index": 14, "consciousness": -85, "value": 3, "db_path": "04-01-01-04"},
    {"index": 15, "consciousness": -80, "value": 3, "db_path": "04-01-02-04"},
    {"index": 16, "consciousness": 64, "value": 0, "db_path": "04-01-03-05"},
    {"index": 17, "consciousness": -85, "value": 0, "db_path": "04-01-04-09"},
    {"index": 18, "consciousness": 78, "value": 0, "db_path": "04-02-01-08"},
    {"index": 19, "consciousness": -73, "value": 4, "db_path": "04-02-02-05"},
    {"index": 20, "consciousness": 73, "value": 2, "db_path": "04-02-03-11"},
    {"index": 21, "consciousness": -88, "value": 0, "db_path": "04-02-04-03"},
    {"index": 22, "consciousness": 87, "value": 1, "db_path": "04-03-01-11"},
    {"index": 23, "consciousness": -90, "value": 1, "db_path": "04-03-02-07"},
    {"index": 24, "consciousness": -69, "value": 2, "db_path": "04-03-03-03"},
    {"index": 25, "consciousness": 62, "value": 1, "db_path": "04-03-04-04"},
    {"index": 26, "consciousness": -78, "value": 1, "db_path": "05-01-11"},
    {"index": 27, "consciousness": 99, "value": 27, "db_path": "05-02-28"}
  ],
  "notes": {
    "database_version": "Vrs.8.1.0_ALPHA"
  }
}`;