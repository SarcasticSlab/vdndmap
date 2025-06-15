let uploadedImages = {}; // id -> Image object or URL
let selectedImageId = null;
let imageIdCounter = 0;

function triggerImageUpload() {
  document.getElementById('imageUploader').click();
}

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.src = e.target.result;
    const id = imageIdCounter++;
    uploadedImages[id] = img;
    addThumbnail(id, img.src);
  };
  reader.readAsDataURL(file);

  // Reset input so same file can be uploaded again
  event.target.value = '';
}

function addThumbnail(id, src) {
  const strip = document.getElementById('imageStrip');
  const thumb = document.createElement('img');
  thumb.src = src;
  thumb.classList.add('thumbnail');
  thumb.onclick = () => {
    document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('selected'));
    thumb.classList.add('selected');
    selectedImageId = id;
  };
  thumb.onclick();
  strip.appendChild(thumb);
}

function preloadImagesFromFolder() {
  // Define a list of image names you expect in the folder (since JS cannot list local files without backend support)
  const imageNames = ['Boss.png', 'Howard.png', 'Lexi.png', 'Ruviel.png', 'Shion.png', 'Tarion.png']; // Add all your token image filenames here
  imageNames.forEach(name => {
    const src = `./tokens/${name}`;
    const img = new Image();
    img.onload = () => {
      const id = imageIdCounter++;
      uploadedImages[id] = img;
      addThumbnail(id, src);
    };
    img.src = src;
  });
}

const dropZone = document.getElementById("tokenZone");

dropZone.addEventListener("dragover", function(event) {
  event.preventDefault(); // Allow drop
  dropZone.classList.add("drag-over"); // Optional styling
});

dropZone.addEventListener("dragleave", function(event) {
  dropZone.classList.remove("drag-over"); // Optional styling
});

dropZone.addEventListener("drop", function(event) {
  event.preventDefault();
  dropZone.classList.remove("drag-over");

  const file = event.dataTransfer.files[0];
  if (!file) return;

  // Create a fake event object to reuse your existing function
  const fakeEvent = {
    target: {
      files: [file],
      value: '' // required for the reset at the end
    }
  };

  handleImageUpload(fakeEvent);
});

window.addEventListener('DOMContentLoaded', preloadImagesFromFolder);