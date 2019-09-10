async function ocr() {
  const vision = require('@google-cloud/vision');
  const client = new vision.ImageAnnotatorClient();
  const filename = '../sample/wakeupcat.jpg';
  const [result] = await client.textDetection(filename);
  const detections = result.textAnnotations;
  console.log('Text:');
  detections.forEach(text => {
    console.log(text.description);
    console.log(text.boundingPoly.vertices);
  });
}
ocr();
