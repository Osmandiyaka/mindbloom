import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-host-landing',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="host-landing">
      <div class="container">
        <div class="logo">
          <h1>🌸 MindBloom</h1>
          <p class="tagline">School Management System</p>
        </div>

        <div class="content">
          <h2>Welcome to MindBloom</h2>
          <p>Please access your school's portal using your school-specific URL:</p>
          
          <div class="url-format">
            <code>your-school.mindbloom.com</code>
          </div>

          <div class="examples">
            <h3>Example URLs:</h3>
            <ul>
              <li><code>greenwood-academy.mindbloom.com</code></li>
              <li><code>oak-valley-school.mindbloom.com</code></li>
              <li><code>bright-future-college.mindbloom.com</code></li>
            </ul>
          </div>

          <div class="cta">
            <p>Don't have a school portal yet?</p>
            <a href="https://mindbloom.com/get-started" class="btn-primary">Get Started</a>
            <a href="https://mindbloom.com/contact" class="btn-secondary">Contact Sales</a>
          </div>
        </div>

        <footer>
          <p>&copy; 2025 MindBloom. All rights reserved.</p>
          <div class="links">
            <a href="https://mindbloom.com/privacy">Privacy</a>
            <a href="https://mindbloom.com/terms">Terms</a>
            <a href="https://mindbloom.com/support">Support</a>
          </div>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .host-landing {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
    }

    .container {
      max-width: 600px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      padding: 3rem;
      text-align: center;
    }

    .logo h1 {
      font-size: 3rem;
      margin: 0;
      color: #667eea;
    }

    .tagline {
      font-size: 1.1rem;
      color: #666;
      margin: 0.5rem 0 2rem;
    }

    .content h2 {
      color: #333;
      margin-bottom: 1rem;
    }

    .content p {
      color: #666;
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }

    .url-format {
      background: #f7f9fc;
      padding: 1rem;
      border-radius: 8px;
      margin: 1.5rem 0;
    }

    .url-format code {
      font-size: 1.2rem;
      color: #667eea;
      font-weight: 600;
    }

    .examples {
      text-align: left;
      background: #f7f9fc;
      padding: 1.5rem;
      border-radius: 8px;
      margin: 2rem 0;
    }

    .examples h3 {
      margin-top: 0;
      color: #333;
      font-size: 1rem;
    }

    .examples ul {
      list-style: none;
      padding: 0;
      margin: 1rem 0 0;
    }

    .examples li {
      padding: 0.5rem 0;
    }

    .examples code {
      color: #667eea;
      background: white;
      padding: 0.3rem 0.6rem;
      border-radius: 4px;
      font-size: 0.95rem;
    }

    .cta {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid #e0e0e0;
    }

    .cta p {
      font-weight: 600;
      color: #333;
      margin-bottom: 1rem;
    }

    .btn-primary, .btn-secondary {
      display: inline-block;
      padding: 0.75rem 2rem;
      margin: 0.5rem;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-primary:hover {
      background: #5568d3;
      transform: translateY(-2px);
    }

    .btn-secondary {
      background: white;
      color: #667eea;
      border: 2px solid #667eea;
    }

    .btn-secondary:hover {
      background: #f7f9fc;
      transform: translateY(-2px);
    }

    footer {
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid #e0e0e0;
      color: #999;
      font-size: 0.9rem;
    }

    footer p {
      margin: 0 0 1rem;
      color: #999;
    }

    .links {
      display: flex;
      gap: 1.5rem;
      justify-content: center;
    }

    .links a {
      color: #667eea;
      text-decoration: none;
    }

    .links a:hover {
      text-decoration: underline;
    }

    @media (max-width: 768px) {
      .container {
        padding: 2rem;
      }

      .logo h1 {
        font-size: 2rem;
      }

      .btn-primary, .btn-secondary {
        display: block;
        margin: 0.5rem 0;
      }
    }
  `]
})
export class HostLandingComponent {}
