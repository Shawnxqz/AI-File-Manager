
// File list
const { ipcRenderer } = require('electron')

ipcRenderer.on('files', (event, files) => {
    const fileList = document.getElementById('file-list')
    if (!fileList) {
      console.error('File list element not found')
      return
    }
  
    files.forEach(file => {
      const li = document.createElement('li')
      li.innerText = file
      fileList.appendChild(li)
    })


    // File Counter 
    const fileCount = document.getElementById('file-count')
    fileCount.innerText = `共有 ${files.length} 个文件。`



    // Classify Button
    const { Configuration, OpenAIApi } = require("openai")

    require('dotenv').config()

    const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    })
    delete configuration.baseOptions.headers['User-Agent']
    const openai = new OpenAIApi(configuration)

    const classifyBtn = document.getElementById('classify-btn')
    const classifyRes = document.getElementById('classify-res')

    classifyBtn.addEventListener('click', () => {
        const fileList = document.querySelectorAll('#file-list li');
        const filenames = Array.from(fileList).map(li => li.innerText);
    
        const classifyPrompt = "This is a collation task. The following is a list of file names." + 
        "Note that the name without suffix means this is a folder. Categorize them based on the file names" +
        ", the context and purpose, you can guess if they are not clear. If a folder's name is general" +
        " enough, it can be used as a category. At least 5 categories. If a folder is used as a category, it cannot be classified into another category." +
        " Each file can only be assigned to a single category. Reference category: Game, documents, Code, Miscellaneous\n\n" + 
        filenames.join("\n\n")+"\n\nPlease provide the result of collation. Return format" +
        " should be in JSON form. Before returing the answer, you should try to parse it, if it occurs error, modify it and parse again." +
        " Return the answer when there is no parse error. \n\n"

        console.log(classifyPrompt)
        console.log("starting classification...")
    
        // Create a promise to get classification results
        const classifyPromise = () => {
            return new Promise((resolve, reject) => {
                openai.createCompletion({
                    model: "text-davinci-003",
                    prompt: classifyPrompt,
                    max_tokens: 3000,
                }).then((response) => {
                    resolve(response.data.choices[0].text)
                }).catch((error) => {
                    reject(error)
                })
            })
        }

        // Call the promise and handle the response using .then()
        classifyPromise().then((result) => {
            console.log("Completed!")
            result = JSON.parse(result)
            console.log(result)
            console.log(result.length)
            classifyRes.innerText = result

            const fs = require('fs');
            const path = require('path');
            const os = require('os')

            // assuming the result object is stored in the 'result' variable
            const categories = Object.keys(result);
            console.log(categories.length)
            categories.forEach((category) => {
            // create a directory for each category on the desktop
                const folderName = category;
                const folderPath = path.join(os.homedir(), 'Desktop', folderName);
                if (!fs.existsSync(folderPath)) {
                    fs.mkdirSync(folderPath);
                }
                for (const file of result[category]) {
                    const filePath = path.join(os.homedir(), 'Desktop', file);
                    const destPath = path.join(folderPath, file);
                    fs.renameSync(filePath, destPath);
                }
            });

        }).catch((error) => {
            console.log(error)
        })
    })
})
