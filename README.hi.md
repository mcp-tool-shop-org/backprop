<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <strong>हिन्दी</strong> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português</a>
</p>

<p align="center">
  <img src="./logo.png" alt="Backprop Logo" width="250" />
</p>

<p align="center">
  <em>A CLI-first ML trainer that defaults to short, safe 10-minute runs with intelligent resource governance.</em>
</p>

<a id="getting-started"></a>

## शुरुआत करें

<a id="1-install"></a>

### 1. इंस्टॉल करें

```bash
npm install -g @mcptoolshop/backprop
```

<a id="2-run-a-training-script"></a>

### 2. ट्रेनिंग स्क्रिप्ट चलाएं

```bash
backprop run train.py --name my-first-run
```

बस इतना ही। Backprop अपने आप:

1. जांच करेगा कि आपके सिस्टम में पर्याप्त RAM और GPU VRAM है।
1. स्क्रिप्ट शुरू करेगा और इसकी प्रगति को ट्रैक करेगा।
1. 10 मिनट के बाद इसे शालीनतापूर्वक बंद करेगा (`-m` के माध्यम से कॉन्फ़िगर करने योग्य)।
1. रन मेटाडेटा और चेकपॉइंट्स को `~/.backprop/experiments.json` में सहेजेगा।

<a id="how-it-works"></a>

## यह कैसे काम करता है

<a id="the-governor"></a>

### गवर्नर

Backprop में एक बुद्धिमान Governor शामिल है जो रन से पहले और उसके दौरान आपके सिस्टम संसाधनों की निगरानी करता है। यह CPU लोड, उपलब्ध RAM, और GPU VRAM/तापमान को जांचता है (`nvidia-smi` के माध्यम से)। अगर आपका सिस्टम भारी लोड में है या बहुत गर्म हो रहा है, तो Governor रन को शुरू होने से रोकेगा या जब तक संसाधन खाली न हो जाएं तब तक इसे रोक देगा।

<a id="short-runs-auto-resume"></a>

### छोटे रन + ऑटो-रिज्यूम

48 घंटे तक स्क्रिप्ट चलाने और प्रार्थना करने के बजाय कि यह क्रैश न हो, Backprop **सीमित समय वाले रन** को प्रोत्साहित करता है। डिफ़ॉल्ट रूप से, रन 10 मिनट तक सीमित होते हैं।

अगर आपकी स्क्रिप्ट चेकपॉइंट पाथ आउटपुट करती है (जैसे, `{"event": "checkpoint_saved", "path": "/tmp/ckpt.pt"}`), तो Backprop उन्हें याद रखता है। आप आसानी से एक बाधित या सीमित समय वाले रन को फिर से शुरू कर सकते हैं:

```bash
backprop resume <run-id>
```

<a id="resource-monitoring"></a>

### संसाधन निगरानी

Backprop NVIDIA GPUs की सटीक निगरानी के लिए `nvidia-smi` का उपयोग करता है। यह सबसे अधिक मुक्त VRAM वाले GPU को स्वचालित रूप से चुनता है और एक रन शुरू करने से पहले यह सुनिश्चित करता है कि यह आपकी न्यूनतम आवश्यकताओं को पूरा करता है।

आप किसी भी समय अपने सिस्टम की वर्तमान संसाधन स्थिति जांच सकते हैं:

```bash
backprop status
```

<a id="usage"></a>

## उपयोग

<a id="run-a-training-script"></a>

### ट्रेनिंग स्क्रिप्ट चलाएं

```bash
backprop run train.py
```

विकल्प:

- `-m, --max-run-minutes <minutes>`: अधिकतम रन समय मिनट में (डिफ़ॉल्ट: 10)
- `-f, --framework <type>`: उपयोग करने के लिए फ्रेमवर्क (pytorch | tensorflow | auto) (डिफ़ॉल्ट: auto)
- `-c, --checkpoint-every-minutes <minutes>`: चेकपॉइंट अंतराल मिनट में
- `-r, --resume-from <path>`: फिर से शुरू करने के लिए चेकपॉइंट का पाथ
- `--run-id <id>`: इस रन के लिए अद्वितीय पहचान
- `-n, --name <name>`: इस प्रयोग के लिए मानव-पठनीय नाम
- `-g, --gpu-memory-limit <limit>`: GPU मेमोरी सीमा (जैसे, "80%" या GB के लिए "8")
- `-p, --max-parallel <count>`: अधिकतम समानांतर रन
- `--min-free-ram <gb>`: रन शुरू करने के लिए न्यूनतम मुक्त RAM GB में (डिफ़ॉल्ट: 4)
- `--gpu-probe <type>`: GPU प्रोब प्रकार (auto | nvidia-smi | none)
- `--gpu-min-vram <mb>`: रन शुरू करने के लिए न्यूनतम मुक्त VRAM MB में (डिफ़ॉल्ट: 2500)
- `--gpu-max-temp <c>`: अधिकतम GPU तापमान सेल्सियस में (डिफ़ॉल्ट: 85)

<a id="configuration-file"></a>

### कॉन्फ़िगरेशन फ़ाइल

आप अपने प्रोजेक्ट रूट में `backprop.config.json` बना सकते हैं:

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

<a id="list-experiments"></a>

### प्रयोगों को सूचीबद्ध करें

```bash
backprop list
```

<a id="development"></a>

## विकास

```bash
pnpm install
pnpm build
pnpm test
```
