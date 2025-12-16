import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(
  defineConfig({
    title: "KeenVPN Architecture",
    description: "Military-grade VPN Engineering Documentation",
    srcDir: '.',
    cleanUrls: true,
    base: '/docs/',

    themeConfig: {
      nav: [
        { text: 'Home', link: '/' },
        { text: 'Architecture', link: '/new/architecture/C4_B2C_PHOENIX' },
        { text: 'Client', link: '/new/clients/CLIENT_DETAILED_DESIGN' },
        { text: 'Security', link: '/new/security/THREAT-MODEL-001' }
      ],

      sidebar: {
        '/new/': [
          {
            text: 'System Architecture',
            items: [
              { text: 'B2C (Phoenix) C4 Model', link: '/new/architecture/C4_B2C_PHOENIX' },
              { text: 'B2B (Aegis) C4 Model', link: '/new/architecture/C4_B2B_AEGIS' },
              { text: 'B2B Architecture RFC', link: '/new/architecture/B2B_ARCHITECTURE_RFC' },
              { text: 'Infrastructure Design', link: '/new/architecture/INFRASTRUCTURE_DESIGN' },
              { text: 'Infra Detailed Design', link: '/new/architecture/INFRASTRUCTURE_DETAILED_DESIGN' },
              { text: 'Infra Scaffolding', link: '/new/architecture/INFRASTRUCTURE_SCAFFOLDING' },
              { text: 'Backend Services', link: '/new/architecture/BACKEND_SERVICE_CATALOG' },
              { text: 'B2C Backend Design', link: '/new/architecture/B2C_BACKEND_DESIGN' }
            ]
          },
          {
            text: 'Client Engineering',
            items: [
              { text: 'Client Architecture', link: '/new/clients/CLIENT_ARCHITECTURE' },
              { text: 'Detailed Design (iOS/macOS)', link: '/new/clients/CLIENT_DETAILED_DESIGN' },
              { text: 'Scaffolding', link: '/new/clients/CLIENT_SCAFFOLDING' },
              { text: 'Android Roadmap', link: '/new/clients/ANDROID_ROADMAP' }
            ]
          },
          {
            text: 'Feature Specifications',
            items: [
              { text: 'AdBlock Privacy Spec', link: '/new/features/ADBLOCK_PRIVACY_SPEC' }
            ]
          },
          {
            text: 'Security Analysis',
            items: [
              { text: 'Threat Model', link: '/new/security/THREAT-MODEL-001' }
            ]
          }
        ],
        '/current/': [
          {
            text: 'Security Audits',
            items: [
              { text: 'Auth Audit Report', link: '/current/AUTH_AUDIT_REPORT' },
              { text: 'Subscription Security', link: '/current/VPN_SUBSCRIPTION_SECURITY' }
            ]
          },
          {
            text: 'Legacy Architecture',
            items: [
              { text: 'System Overview', link: '/current/detailed_architecture/SYSTEM_OVERVIEW' },
              { text: 'Architecture Map', link: '/current/ARCHITECTURE_MAP' },
              { text: 'Backend Services', link: '/current/detailed_architecture/BACKEND' },
              { text: 'Android Client', link: '/current/detailed_architecture/ANDROID' },
              { text: 'iOS/macOS Client', link: '/current/detailed_architecture/IOS_MACOS' }
            ]
          }
        ]
      },

      socialLinks: [
        { icon: 'github', link: 'https://github.com/Keen-VPN' }
      ],

      footer: {
        message: 'Released under Proprietary License.',
        copyright: 'Copyright © 2025 KeenVPN Security Ops.'
      }
    },

    mermaid: {
      // Mermaid specific config
    }
  })
)
