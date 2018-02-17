import * as functions from 'firebase-functions';

// Firebase
import * as admin from 'firebase-admin';
admin.initializeApp(functions.config().firebase);


// Cloud Vision
import * as vision from '@google-cloud/vision';
const visionClient =  new vision.ImageAnnotatorClient();

const bucketName = 'tesla-369.appspot.com';



export const tesla369OCRImagem = functions.storage
    
    .bucket(bucketName)
    .object()
    .onChange( async event => {

     //se o arquivo não existe retorna falso
      if (event.data.resourceState == 'not_exists') return false;

            const object = event.data;
            const filePath = object.name;   

            const imageUri = `gs://${bucketName}/${filePath}`;

            const docId = filePath.split('.jpg')[0];

            const docRef  = admin.firestore().collection('photos').doc(docId);
            //se entrar entrar png não faz nada
            if (filePath.endsWith('.png')) return false;
            //se entrar pdf não faz nada
            if (!filePath.endsWith('.pdf')) return false;

            // Text Extraction
            const textRequest = await visionClient.documentTextDetection(imageUri)
            const fullText = textRequest[0].textAnnotations[0]
            const text =  fullText ? fullText.description : null

            // Web Detection
            const webRequest = await visionClient.webDetection(imageUri)
            const web = webRequest[0].webDetection

            // Faces    
            const facesRequest = await visionClient.faceDetection(imageUri)
            const faces = facesRequest[0].faceAnnotations

            // Landmarks
            const landmarksRequest = await visionClient.landmarkDetection(imageUri)
            const landmarks = landmarksRequest[0].landmarkAnnotations
            
            // Save to Firestore
            const data = { text, web, faces, landmarks }
            return docRef.set(data)
                

});
