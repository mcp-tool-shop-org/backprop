<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/backprop/readme.png" alt="Backprop Logo" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/backprop/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/backprop/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/backprop/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/backprop"><img src="https://img.shields.io/npm/v/%40mcptoolshop%2Fbackprop" alt="npm version"></a>
</p>

<p align="center">
  <em>A CLI-first ML trainer that defaults to short, safe 10-minute runs with intelligent resource governance.</em>
</p>

## शुरुआत कैसे करें

### 1. इंस्टाल करें

```bash
npm install -g @mcptoolshop/backprop
```

### 2. एक प्रशिक्षण स्क्रिप्ट चलाएं

```bash
backprop run train.py --name my-first-run
```

बस इतना ही। बैकप्रोप स्वचालित रूप से:
1. जांच करेगा कि आपके सिस्टम में पर्याप्त रैम और जीपीयू वीआरएएम है या नहीं।
2. स्क्रिप्ट शुरू करेगा और उसकी प्रगति को ट्रैक करेगा।
3. 10 मिनट के बाद इसे बंद कर देगा (जिसे `-m` के माध्यम से कॉन्फ़िगर किया जा सकता है)।
4. रन मेटाडेटा और चेकपॉइंट को `~/.backprop/experiments.json` में सहेजेगा।

## यह कैसे काम करता है

### नियंत्रक (गवर्नर)
बैकप्रोप में एक बुद्धिमान नियंत्रक (गवर्नर) शामिल है जो आपके सिस्टम संसाधनों की निगरानी रन शुरू होने से पहले और उसके दौरान करता है। यह सीपीयू लोड, उपलब्ध रैम और जीपीयू वीआरएएम/तापमान (nvidia-smi के माध्यम से) की जांच करता है। यदि आपका सिस्टम अत्यधिक लोड के तहत है या बहुत गर्म चल रहा है, तो नियंत्रक रन को शुरू होने से रोक देगा या संसाधनों के मुक्त होने तक उसे रोक देगा।

### छोटे रन + ऑटो-रिज़्यूम
किसी स्क्रिप्ट को 48 घंटे तक लगातार चलाने और प्रार्थना करने के बजाय कि वह क्रैश न हो, बैकप्रोप "**समय-सीमित रन**" को प्रोत्साहित करता है। डिफ़ॉल्ट रूप से, रन 10 मिनट तक सीमित होते हैं।

यदि आपकी स्क्रिप्ट चेकपॉइंट पथों का आउटपुट करती है (जैसे, `{"event": "checkpoint_saved", "path": "/tmp/ckpt.pt"}`), तो बैकप्रोप उन्हें याद रखता है। आप आसानी से किसी बाधित या समय-सीमित रन को फिर से शुरू कर सकते हैं:

```bash
backprop resume <run-id>
```

### संसाधन निगरानी
बैकप्रोप NVIDIA जीपीयू की सटीक निगरानी के लिए `nvidia-smi` का उपयोग करता है। यह स्वचालित रूप से सबसे अधिक मुफ्त वीआरएएम वाले जीपीयू का चयन करता है और यह सुनिश्चित करता है कि यह रन शुरू करने से पहले आपकी न्यूनतम आवश्यकताओं को पूरा करता है।

आप किसी भी समय अपने सिस्टम की वर्तमान संसाधन स्थिति की जांच कर सकते हैं:

```bash
backprop status
```

## उपयोग

### एक प्रशिक्षण स्क्रिप्ट चलाएं

```bash
backprop run train.py
```

विकल्प:
- `-m, --max-run-minutes <minutes>`: अधिकतम रन समय मिनटों में (डिफ़ॉल्ट: 10)
- `-f, --framework <type>`: उपयोग करने के लिए फ्रेमवर्क (pytorch | tensorflow | auto) (डिफ़ॉल्ट: auto)
- `-c, --checkpoint-every-minutes <minutes>`: चेकपॉइंट अंतराल मिनटों में
- `-r, --resume-from <path>`: जिस चेकपॉइंट से फिर से शुरू करना है उसका पथ
- `--run-id <id>`: इस रन के लिए अद्वितीय पहचानकर्ता
- `-n, --name <name>`: इस प्रयोग के लिए मानव-पठनीय नाम
- `-g, --gpu-memory-limit <limit>`: जीपीयू मेमोरी सीमा (जैसे, "80%" या "8" जीबी के लिए)
- `-p, --max-parallel <count>`: अधिकतम समानांतर रन
- `--min-free-ram <gb>`: रन शुरू करने के लिए न्यूनतम मुफ्त रैम जीबी में (डिफ़ॉल्ट: 4)
- `--gpu-probe <type>`: जीपीयू जांच प्रकार (auto | nvidia-smi | none)
- `--gpu-min-vram <mb>`: रन शुरू करने के लिए न्यूनतम मुफ्त वीआरएएम एमबी में (डिफ़ॉल्ट: 2500)
- `--gpu-max-temp <c>`: सेल्सियस में अधिकतम जीपीयू तापमान (डिफ़ॉल्ट: 85)

### कॉन्फ़िगरेशन फ़ाइल

आप अपने प्रोजेक्ट के रूट में `backprop.config.json` बना सकते हैं:

```json
{
  "maxRunMinutes": 30,
  "maxParallel": 2,
  "gpuMemoryLimit": "80%",
  "gpu": {
    "probe": "auto",
    "minFreeVramMB": 2500,
    "maxTempC": 85
  }
}
```

### प्रयोगों की सूची बनाएं

```bash
backprop list
```

## सुरक्षा और डेटा दायरा

बैकप्रोप पूरी तरह से **स्थानीय रूप से** काम करता है - कोई नेटवर्क अनुरोध नहीं, कोई टेलीमेट्री नहीं, कोई क्लाउड सेवाएं नहीं।

- **पहुंचे गए डेटा:** प्रशिक्षण कॉन्फ़िगरेशन फ़ाइलें (`backprop.config.json`) पढ़ता है। पायथन प्रशिक्षण प्रक्रियाएं शुरू करता है और सिस्टम संसाधनों (सीपीयू, रैम, जीपीयू nvidia-smi के माध्यम से) की निगरानी करता है। प्रयोग मेटाडेटा और लॉकफ़ाइलों को प्रोजेक्ट निर्देशिका में लिखता है।
- **पहुंचे गए डेटा नहीं:** कोई नेटवर्क अनुरोध नहीं। कोई टेलीमेट्री नहीं। कोई क्रेडेंशियल स्टोरेज नहीं। प्रशिक्षण डेटा स्थानीय रहता है - बैकप्रोप प्रक्रियाओं का समन्वय करता है, यह प्रशिक्षण डेटासेट नहीं पढ़ता है।
- **आवश्यक अनुमतियाँ:** कॉन्फ़िगरेशन, प्रयोग लॉग और लॉकफ़ाइलों के लिए फ़ाइल सिस्टम एक्सेस। पायथन प्रशिक्षण स्क्रिप्ट के लिए प्रक्रिया स्पॉनिंग।

भेद्यता रिपोर्टिंग के लिए [SECURITY.md](SECURITY.md) देखें।

---

## स्कोरकार्ड

| श्रेणी | स्कोर |
|----------|-------|
| सुरक्षा | 10/10 |
| त्रुटि प्रबंधन | 10/10 |
| ऑपरेटर दस्तावेज़ | 10/10 |
| शिपिंग स्वच्छता | 10/10 |
| पहचान | 10/10 |
| **Overall** | **50/50** |

---

## विकास

```bash
pnpm install
pnpm build
pnpm test
```

---

<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> द्वारा बनाया गया।
