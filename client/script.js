import bot from './assets/bot.svg';
import user from './assets/user.svg';

const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');

let loadInterval;

function loader(element) {
  element.textContent = '';
  loadInterval = setInterval(() => {
    element.textContent += '.';

    if (element.textContent === '....') {
      element.textContent = '';
    }
  }, 300);
}

function typeText(element, text) {
  let index = 0;
  let interval = setInterval(() => {
    if (index < text.length) {
      element.innerHTML += text.charAt(index);
      index++;
    } else {
      clearInterval(interval);
    }
  }, 20);
}

function generateUniqueId() {
  const timestamp = Date.now();
  const randomNumber = Math.random();
  const hexadecimalString = randomNumber.toString(16);
  return `id-${timestamp}-${hexadecimalString}`; 
}

function chatStripe(value, uniqueId) {
  return (
    `
    <div class="wrapper">
      <div class="chat">
        <div class="profile">
          <img
            src="${user}"
            alt="user"
          />
        </div>
        <div class="message" id="${uniqueId}">${value}</div>
      </div>
    </div>
    `
  )
}

function chatAiStripe(value, sourceTranslation, uniqueId) {
  return (
    `
    <div class="wrapper ai}">
      <div class="chat">
        <div class="profile">
          <img
            src="${bot}"
            alt="bot"
          />
        </div>
        <div class="message" id="${uniqueId}">${value}</div>
      </div>
    </div>
    <div class="wrapper ai}">
      <div class="chat">
        <div class="profile" style="display: none">
          <img
            src="${bot}"
            alt="bot"
          />
        </div>
        <div class="message source_translation" id="${uniqueId}-st">English: ${sourceTranslation}</div>
      </div>
    </div>
    `
  )
}

// copied from https://dmitripavlutin.com/timeout-fetch-request/
async function fetchWithTimeout(resource, options = {}) {
  // 8 secs
  const { timeout = 8000 } = options;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal  
  });
  clearTimeout(id);
  return response;
}

const handleSubmit = async (e) => {
  e.preventDefault();
  const data = new FormData(form);

  // user's chatstripe
  chatContainer.innerHTML += chatStripe(data.get('prompt'));

  form.reset();

  // bot's chatstripe
  const uniqueId = generateUniqueId();
  chatContainer.innerHTML += chatAiStripe(' ', ' ', uniqueId);

  chatContainer.scrollTop = chatContainer.scrollHeight;
  const messageDiv = document.getElementById(uniqueId);
  const sourceTranslationDiv = document.getElementById(`${uniqueId}-st`);

  loader(messageDiv);

  try {
    const response = await fetchWithTimeout('http://localhost:5001', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: data.get('prompt')
      }),
      // 30 sec
      timeout: 30000,
    });
    clearInterval(loadInterval);
    messageDiv.innerHTML = '';

    if (response.ok) {
      const data = await response.json();
      const parsedData = data.bot.trim();
      typeText(messageDiv, parsedData);
      
      if (data.botSourceTranslation) {
        const parsedSourceTranslation = data.botSourceTranslation.trim();
        typeText(sourceTranslationDiv, parsedSourceTranslation);
      }
    } else {
      const err = await response.text();
      messageDiv.innerHTML = '(Something went wrong...)';
      alert(err);
    }
  } catch (error) {
    clearInterval(loadInterval);
    messageDiv.innerHTML = '(Something went wrong...)';
    alert(error);
  }
}

form.addEventListener('submit', handleSubmit);
form.addEventListener('keyup', (e) => {
  if (e.keyCode === 13) {
    handleSubmit(e);
  }
});