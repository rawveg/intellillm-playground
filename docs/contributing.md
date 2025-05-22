# Contributing

[← Back to Main README](../README.md) | [Features](./features.md) | [Installation](./installation.md) | [Parameters](./parameters.md) | [File Attachments](./file-attachments.md) | [Web Search](./web-search.md) | [API Reference](./api-reference.md)

---

Contributions, bug reports, and feature requests are welcome! This document outlines how to contribute to the IntelliLLM Playground project.

## Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rawveg/intellillm-playground.git
   cd intellillm-playground
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Access the app:**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development Guidelines

### Code Style

- Follow the existing code style and patterns in the project
- Use TypeScript for type safety
- Follow React best practices
- Use TailwindCSS for styling

### Project Structure

- `/src/app`: Next.js app router components and pages
- `/src/components`: Reusable React components
- `/src/lib`: Utility functions and shared code
- `/src/app/api`: API routes
- `/prompts`: Storage location for prompt files

### Testing

- Write tests for new features
- Ensure existing tests pass before submitting a pull request
- Run tests with `npm test`

## Contribution Process

1. **Fork the repo**
2. **Create your feature branch:**
   ```bash
   git checkout -b feature/YourFeature
   ```
3. **Commit your changes:**
   ```bash
   git commit -am 'Add some feature'
   ```
4. **Push to the branch:**
   ```bash
   git push origin feature/YourFeature
   ```
5. **Open a pull request**

## Pull Request Guidelines

- Provide a clear description of the changes
- Reference any related issues
- Update documentation as needed
- Ensure all tests pass
- Follow the YAGNI (You Aren't Gonna Need It) principle to prevent bloat
- Keep changes focused and minimal

## Feature Requests

When proposing new features, please:

1. Explain the problem the feature solves
2. Describe how the feature should work
3. Explain how it benefits prompt engineers and data scientists
4. Consider whether it aligns with the project's focus on being lightweight and relevant

## Bug Reports

When reporting bugs, please include:

1. A clear description of the bug
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Screenshots if applicable
6. Browser/environment information

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the issue, not the person
- Be patient with new contributors

## License

By contributing to this project, you agree that your contributions will be licensed under the project's [AGPL v3 License](../LICENSE).
