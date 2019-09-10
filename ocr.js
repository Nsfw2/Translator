const vision = require('@google-cloud/vision');

async function ocr(filename) {
  const client = new vision.ImageAnnotatorClient();
  const [result] = await client.textDetection(filename);
  const detections = result.textAnnotations;
  console.log('Text:');
  detections.forEach(text => {
    console.log(text.description);
    console.log(text.boundingPoly.vertices);
  });
}

const filename = '../sample/wakeupcat.jpg';
ocr(filename);
