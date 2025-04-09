# 🕵️‍♂️ SCOUT - Smart Crawler Online Utility Tool

**SCOUT** is a Chrome extension that allows you to easily generate web crawling code. By selecting the desired area on a webpage and providing your requirements in natural language, SCOUT utilizes the DeepSeek API to automatically generate ready-to-use web crawling code.

---

![Status](https://img.shields.io/badge/status-Under%20Development-red)
![DeepSeek API](https://img.shields.io/badge/DeepSeek-API-green?logo=deepseek)
![License](https://img.shields.io/badge/License-MIT-brightgreen)

---

## ✨ Key Features

- **Intuitive Element Selection**  
  Directly select the section of the webpage you want to crawl.

- **Full Page or Specific Element**  
  Choose between crawling the entire page or just a specific element.

- **Natural Language Requirements**  
  Input your data extraction instructions using everyday language.

- **Multi-language Support**  
  Generates code in various languages, including Python (Selenium) and JavaScript (Puppeteer).

- **Ready-to-use Code**  
  Instantly copy and paste the generated code into your development environment.

---

## 🔧 Installation

### Installing in Developer Mode

1. Clone the repository or [download the ZIP](#) and extract it.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer Mode** in the upper right corner.
4. Click **Load unpacked extension**.
5. Select the extracted `scout` folder.

### Installing from the Chrome Web Store *(After Release)*

1. Open the Chrome Web Store and search for **SCOUT - Web Crawling Assistant**.
2. Click **Add to Chrome**.

---

## ⚙️ Initial Setup

1. After installation, click the extension icon and open **Settings**.
2. Enter your **DeepSeek API key**.  
   → Don’t have one? [Visit the DeepSeek Developer Portal](#) to obtain an API key.
3. Set your **preferred code language** and other options.
4. Click **Save**.

---

## 🚀 How to Use

### Full Page Crawling

1. On the webpage, right-click on an empty space.
2. Select **Generate Full Page Crawling Code** from the context menu.
3. Enter your instructions.  
   Example:  
   `Extract all news article titles, dates, and links and save them as a CSV file.`
4. Click **Generate Crawling Code**.

### Selected Area Crawling

1. Drag to highlight the element(s) you want to crawl.
2. Right-click the selection.
3. Choose **Generate Crawling Code for Selected Area**.
4. Enter your instructions.  
   Example:  
   `Extract all product information in the same format as shown on these product cards.`
5. Click **Generate Crawling Code**.

### Using the Generated Code

1. The generated code will appear in a popup.
2. Click **Copy Code** to copy it.
3. Paste the code into your dev environment.
4. Modify it as needed!

---

## 🧰 Prerequisites

- ✅ Chrome Browser (version 88 or above)
- ✅ DeepSeek API key
- ✅ A development environment (e.g., Python, Node.js)

---

## 📄 License

This project is licensed under the **MIT License**.  
See the [LICENSE](./LICENSE) file for more details.

---

## 🤝 Contact and Contributions

- **🐞 Bug Reports & Feature Requests:**  
  Submit issues via [GitHub Issues](https://github.com/your-org/scout/issues)

- **🛠️ Code Contributions:**  
  PRs are welcome! Fork this repo and submit your changes via a Pull Request.

---

> Enjoy creating your web crawling code effortlessly with **SCOUT**!