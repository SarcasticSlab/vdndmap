let uploadedImages_left = {}; // id -> Image object or URL
let uploadedImages_right = {}; // id -> Image object or URL
let selectedImageId_left = null;
let selectedImageId_right = null;
let imageIdCounter_left = 0;
let imageIdCounter_right = 0;

function triggerImageUpload() {
  document.getElementById('imageUploader').click();
}

function handleImageUpload(event, target) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.src = e.target.result;
    const id = (target == 'left' ? imageIdCounter_left++ : imageIdCounter_right++);
    (target == 'left' ? uploadedImages_left : uploadedImages_right)[id] = img;
    addThumbnail(id, img.src, target);
  };
  reader.readAsDataURL(file);

  // Reset input so same file can be uploaded again
  event.target.value = '';
}

function addThumbnail(id, src, target) {
  const strip = document.getElementById(target == 'left' ? 'imageStripLeft' : 'imageStripRight');
  const thumb = document.createElement('img');
  thumb.src = src;
  thumb.classList.add('thumbnail');
  thumb.onclick = () => {
    document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('selected'));
    thumb.classList.add('selected');
    if (target == 'left') {
      selectedImageId_left = id;
    } else {
      selectedImageId_right = id;
    }
  };
  thumb.onclick();
  strip.appendChild(thumb);
}

function preloadImagesFromFolder() {
  // Define a list of image names you expect in the folder (since JS cannot list local files without backend support)
  const imageNamesLeft = ['Boss.png', 'Howard.png', 'Lexi.png', 'Ruviel.png', 'Shion.png', 'Tarion.png']; // Add all your token image filenames here
  imageNamesLeft.forEach(name => {
    const src = `./tokens/${name}`;
    const img = new Image();
    img.onload = () => {
      const id = imageIdCounter_left++;
      uploadedImages_left[id] = img;
      addThumbnail(id, src, 'left');
    };
    img.src = src;
  });
    // Define a list of image names you expect in the folder (since JS cannot list local files without backend support)
  const imageNamesRight = ['Template.png']; // Add all your token image filenames here
  imageNamesRight.forEach(name => {
    const src = `./tokens/${name}`;
    const img = new Image();
    img.onload = () => {
      const id = imageIdCounter_right++;
      uploadedImages_right[id] = img;
      addThumbnail(id, src, 'right');
    };
    img.src = src;
  });
}

const dropZoneLeft = document.getElementById("tokenZoneLeft");
const dropZoneRight = document.getElementById("tokenZoneRight");

dropZoneLeft.addEventListener("dragover", function(event) {
  event.preventDefault(); // Allow drop
  dropZoneLeft.classList.add("drag-over"); // Optional styling
});

dropZoneLeft.addEventListener("dragleave", function(event) {
  dropZoneLeft.classList.remove("drag-over"); // Optional styling
});

dropZoneRight.addEventListener("dragover", function(event) {
  event.preventDefault(); // Allow drop
  dropZoneRight.classList.add("drag-over"); // Optional styling
});

dropZoneRight.addEventListener("dragleave", function(event) {
  dropZoneRight.classList.remove("drag-over"); // Optional styling
});

dropZoneLeft.addEventListener("drop", function(event) {
  event.preventDefault();
  dropZoneLeft.classList.remove("drag-over");

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

dropZoneRight.addEventListener("drop", function(event) {
  event.preventDefault();
  dropZoneRight.classList.remove("drag-over");

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