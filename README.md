# Personal Academic Website

A professional academic website built with [Eleventy (11ty)](https://www.11ty.dev/) featuring automatic content management, markdown-based blog posts, and clean academic design.

## 🚀 Features

- **Static Site Generation**: Built with 11ty for fast, secure, and SEO-friendly pages
- **Markdown Blog**: Write blog posts in markdown with frontmatter
- **Data-Driven Content**: Publications, projects, and news managed through JSON files
- **Responsive Design**: Mobile-first design with clean typography
- **GitHub Pages Ready**: Automated deployment with GitHub Actions

## 📁 Project Structure

```
divyanshugit.github.io/
├── src/                    # Source files
│   ├── _includes/          # Nunjucks templates
│   │   ├── base.njk       # Base layout
│   │   ├── blog-post.njk  # Blog post template
│   │   └── ...
│   ├── blog/              # Blog posts (markdown)
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript files
│   ├── data/              # Content data (JSON)
│   │   ├── publications.js
│   │   ├── projects.js
│   │   └── news.js
│   └── *.md               # Page content
├── _site/                 # Generated site (git-ignored)
├── .eleventy.js           # 11ty configuration
└── package.json           # Dependencies
```

## 🛠️ Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/divyanshugit/divyanshugit.github.io.git
cd divyanshugit.github.io

# Install dependencies
npm install

# Run development server
npm start

# Build for production
npm run build
```

The development server will be available at `http://localhost:8080`

## 🚀 Deployment to GitHub Pages

### Quick Start

#### Step 1: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under "Build and deployment":
   - Source: Select **GitHub Actions**

#### Step 2: Push Your Code

```bash
git add .
git commit -m "Setup GitHub Pages deployment"
git push origin main
```

#### Step 3: Wait for Deployment

- Go to the **Actions** tab in your repository
- Watch the "Deploy to GitHub Pages" workflow run
- Once complete (green checkmark), your site is live!

#### Step 4: Visit Your Site

Your site will be available at: `https://divyanshugit.github.io`

### How It Works

The GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically:

1. **Triggers** on every push to `main` branch
2. **Installs** Node.js and dependencies
3. **Builds** your site with `npm run build`
4. **Deploys** the `_site` folder to GitHub Pages

### Troubleshooting Deployment

#### Build Fails

Check the Actions tab for error messages. Common issues:

- **Missing dependencies**: Run `npm install` locally first
- **Build errors**: Test `npm run build` locally
- **Node version**: Ensure you're using Node 18+

#### Site Not Updating

- Check Actions tab for successful deployment
- Clear browser cache (Cmd+Shift+R / Ctrl+Shift+R)
- Wait a few minutes for GitHub's CDN to update

#### Custom Domain

`dvynsh.org` is served by Vercel. GitHub Pages has **no** custom domain set, so it serves a full mirror at `divyanshugit.github.io`. Pages is static only, so `/api/ask` doesn't run there. Canonical tags point at `dvynsh.org`. See `docs/deploy-vercel.md`.

## ✍️ Adding Content

### Blog Posts

Create a new markdown file in `src/blog/`:

```markdown
---
layout: blog-post.njk
title: "Your Blog Post Title"
description: "Brief description for SEO and previews"
date: 2025-11-09
tags:
  - AI Safety
  - Research
featured: true
permalink: /blog/your-post-slug.html
---

Your blog content here in markdown...
```

### Publications

Edit `src/data/publications.js`:

```javascript
{
    id: "paper-2025",
    title: "Your Paper Title",
    authors: ["Divyanshu Kumar", "Co-Author"],
    venue: "Conference Name 2025",
    year: 2025,
    status: "published",
    links: {
        paper: "https://arxiv.org/abs/xxxx.xxxxx",
        code: "https://github.com/username/repo"
    },
    featured: true
}
```

### Projects

Edit `src/data/projects.js`:

```javascript
{
    id: "project-2025",
    title: "Project Name",
    description: "Brief description",
    status: "active",
    technologies: ["Python", "PyTorch"],
    links: {
        code: "https://github.com/username/repo"
    },
    featured: true
}
```

### News

Edit `src/data/news.js`:

```javascript
{
    id: "news-2025",
    date: "Nov 2025",
    content: "Your announcement",
    featured: true
}
```

## 📝 Development Workflow

1. **Start development server**: `npm start`
2. **Make changes** to files in `src/`
3. **Preview** at `http://localhost:8080`
4. **Build for production**: `npm run build`
5. **Commit and push** to deploy

### Deployment Checklist

Before deploying:

- [ ] Test locally with `npm start`
- [ ] Build successfully with `npm run build`
- [ ] Check all links work
- [ ] Verify blog posts render correctly
- [ ] Test on mobile viewport
- [ ] Commit all changes
- [ ] Push to GitHub

## 🎨 Customization

### Styling

All styles are in `src/css/style.css`. The site uses CSS custom properties for easy theming:

```css
:root {
    --primary-color: #2c3e50;
    --accent-color: #3498db;
    --text-color: #333;
    --background-color: #fff;
}
```

### Templates

Modify Nunjucks templates in `src/_includes/` to change page layouts and structure.

### Configuration

Edit `.eleventy.js` to customize:
- Markdown processing
- Template languages
- Output directories
- Passthrough file copying

## 🔧 Available Scripts

```bash
npm start          # Start development server with live reload
npm run build      # Build production site
npm run clean      # Clean _site directory
```

## 📦 Dependencies

- **Eleventy**: Static site generator
- **markdown-it**: Markdown parser
- **Nunjucks**: Templating engine

## 🌐 Live Site

Visit the live site at: [https://divyanshugit.github.io](https://divyanshugit.github.io)

## 📄 License

This project is open source and available under the MIT License.

---

Built with ❤️ using [Eleventy](https://www.11ty.dev/)
