// Memoriq AI Engine ("Plus You")
// Intelligent generative assistant for graduation keepsakes, blessings, teacher remarks, and memory books.
// Works seamlessly offline with built-in contextual generative models, and supports live Google Gemini API.

(() => {
  'use strict';

  const LOCAL_STORAGE_KEY = 'memoriq_gemini_api_key';

  const TEMPLATES = {
    graduation_wish: {
      en: [
        "From small steps in our crèche classroom to bright tomorrows reaching for the stars! {name}, you have brought warmth, laughter, and endless curiosity to Dream Big Crèche. May your educational journey be filled with courage, wonder, and big discoveries.",
        "Today a little learner, tomorrow a world changer! {name}, watching you learn, grow, and conquer new milestones has been our greatest joy. Continue to Dream Big, stand tall, and shine brightly wherever you go.",
        "Congratulations {name} on your graduation! Every story you shared, every picture you painted, and every smile you gifted us is etched into our hearts. Keep reaching higher — education is indeed priceless!"
      ],
      nso: [
        "Go ya pele le go gola ga gago go tliša lethabo le legolo! {name}, o ngwana yo bohlale yo a tletšego ka ditoro tše dikgolo. Re go lakaletša maiteko a mabotse ge o tsena legatong le lefsa la thuto. Thuto ke lehumo le le sa felego!",
        "Re tletše ka boikgantšho lehono ka wena {name}! O bontšhitše sebete le lerato go tšwa tšatši la mathomo. Dula o gola, o ithuta, o be motlotlo ka bokgoni bja gago bja go lora se segolo."
      ],
      sot: [
        "Hōla o be motho e moholo! {name}, toro ea hao ke leseli le tla khantšang bokamoso. Re motlotlo haholo ka wena ha o phethela sethala sena sa hao sa borapedi. Thuto ke lefa la bohlokoa ka ho fetisisa!",
        "Re lebohela katleho ea hao e kholo, {name}! Mehato ena e menyenyane ea kajeno e aha bokamoso bo khanyang ba hosasane. Tsoela pele ho lora litoro tse kholo!"
      ],
      zul: [
        "Halala {name}! Khula uze ube yingqalabutho. Sihlonipha indlela okhule ngayo lapha eDream Big Crèche. Imfundo iyisisekelo sempumelelo yakho — qhubeka ukhanye njengekhehla lekusasa!",
        "Namuhla ungumfundi omncane, kusasa uzoba umholi omkhulu! Siyaziqhenya kakhulu ngawe {name}. Kwangathi uMdali angabusisa izinyathelo zakho zokufunda."
      ]
    },
    teacher_note: {
      en: [
        "Dear {name}, having you in my class was a true blessing. Your bright eyes, eagerness to learn, and kindness to your classmates lit up our days. As you step into Grade R, remember that you are capable of achieving anything. With all my love, {teacher}.",
        "{name}, you came into our crèche with gentle curiosity and now leave as a confident, wonderful graduate. Never stop asking questions and never stop believing in your dreams. You make us so proud! — {teacher}",
        "It feels like just yesterday you took your first tentative steps into our crèche. Today, you stand tall in your graduation cap! Thank you for the memories, the hugs, and the laughter. — {teacher}"
      ],
      nso: [
        "Go {name}, e be e le thabo e kgolo go go ruta le go go bona o gola letšatši le letšatši. O na le pelo e lerato le maikemišetšo a matla. Gopola gore o kgethegile kudu. Ka lerato, {teacher}.",
        "{name}, o ngwana yo a nago le bokamoso bjo bo phadimago. Dula o ena le phišego ya go ithuta dilo tše mpsha. O re dirile ba ba ikgantšhago kudu! — {teacher}"
      ],
      sot: [
        "Ho {name}, ho ba le wena ka phaposing ea rona e bile tlotla e kholo. Boikemisetso ba hao le pososelo ea hao e khantšitse matsatsi a rona. E-ba le sebete sekolong se secha! — {teacher}"
      ],
      zul: [
        "Kuthando lwami {name}, ngiyabonga ngethuba lokukufundisa nokukubona ukhula. Unenhliziyo enhle kakhulu nomqondo obukhali. Ungalokothi uyeke ukuphupha! — {teacher}"
      ]
    },
    dreams_story: {
      en: [
        "When {name} grows up, the world will welcome a brilliant {dream}! At Dream Big Crèche, {name} learned that big dreams start with curiosity, patience, and kindness. With a heart full of hope and a cap on their head, no dream is too far away.",
        "Dream Big, Aim High! {name} has set their heart on becoming a {dream}. Every song sung, number counted, and friend made at crèche is a stepping stone to making that dream a shining reality."
      ],
      nso: [
        "Ge {name} a gola, o duma go ba {dream} yo a hlwahlwilego! Mo Dream Big Crèche, o ithutile gore kgolo e thoma ka mehato e menyenyane. Re tseba gore o tla atlega letšatšing la hosasane.",
      ],
      sot: [
        "Ha {name} a hōla, o batla ho ba {dream} ea ipabolang! Ka tšehetso le lerato la Dream Big Crèche, tsela ea hae e bulehile ho fihlela ditoro tsa hae kaofela.",
      ],
      zul: [
        "Ngesikhathi {name} ekhula, iphupho lakhe elikhulu wukuba {dream}! Lapha eDream Big Crèche, sihlwanyele imbewu yolwazi ezomvumela afinyelele phezulu kakhulu."
      ]
    }
  };

  class MemoriqAIEngine {
    constructor() {
      this.apiKey = localStorage.getItem(LOCAL_STORAGE_KEY) || '';
    }

    setApiKey(key) {
      this.apiKey = (key || '').trim();
      if (this.apiKey) {
        localStorage.setItem(LOCAL_STORAGE_KEY, this.apiKey);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }

    getApiKey() {
      return this.apiKey;
    }

    hasApiKey() {
      return Boolean(this.apiKey && this.apiKey.startsWith('AIza'));
    }

    async generateLiveGemini(prompt, systemInstruction = '') {
      if (!this.hasApiKey()) {
        throw new Error('No valid Google Gemini API key configured.');
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
      const payload = {
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemInstruction}\n\nUser Request: ${prompt}` }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 300,
        }
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `Gemini API returned status ${res.status}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('No text generated by Gemini.');
      return text.trim();
    }

    async generate(type, params) {
      const {
        name = 'Bonolo Makola',
        gender = 'Male',
        dob = '2021-08-18',
        dream = 'Doctor',
        teacher = 'Teacher Thandi',
        lang = 'en',
        customPrompt = ''
      } = params;

      // 1. If user supplied a custom prompt and has a Gemini API key, use live Gemini
      if (this.hasApiKey() && customPrompt) {
        const sys = `You are Memoriq AI, a gentle, poetic, and celebratory AI assistant for Dream Big Crèche in South Africa.
Write a warm, dignified, and touching graduation text for a preschool/crèche graduate.
Student Name: ${name}
Gender: ${gender}
DOB: ${dob}
Future Dream: ${dream}
Teacher: ${teacher}
Language requested: ${lang === 'nso' ? 'Sepedi (Northern Sotho)' : lang === 'sot' ? 'Sesotho' : lang === 'zul' ? 'isiZulu' : 'English'}.
Keep it concise (2-4 sentences max), inspiring, and uplifting.`;
        return await this.generateLiveGemini(customPrompt, sys);
      }

      // 2. Intelligent Built-in generator
      await new Promise(r => setTimeout(r, 450)); // natural micro-pause for delightful UX

      const group = TEMPLATES[type] || TEMPLATES.graduation_wish;
      const list = group[lang] || group.en;
      const template = list[Math.floor(Math.random() * list.length)];

      let result = template
        .replace(/\{name\}/g, name)
        .replace(/\{gender\}/g, gender)
        .replace(/\{dream\}/g, dream)
        .replace(/\{teacher\}/g, teacher);

      return result;
    }
  }

  window.memoriqAI = new MemoriqAIEngine();
})();
