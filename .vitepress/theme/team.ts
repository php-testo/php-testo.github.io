import type { DefaultTheme } from 'vitepress'

// The maintainer card on the sponsor pages, shared by every locale. The avatar is
// served by GitHub, so it follows the profile and never has to be re-uploaded here.
export const members: DefaultTheme.TeamMember[] = [
  {
    avatar: 'https://github.com/roxblnfk.png',
    name: 'Aleksei Gagarin',
    title: 'Author and maintainer of Testo',
    links: [
      { icon: 'github', link: 'https://github.com/roxblnfk' },
      { icon: 'x', link: 'https://x.com/roxblnfk' },
      { icon: 'mastodon', link: 'https://phpc.social/@roxblnfk' },
    ],
    sponsor: 'https://boosty.to/roxblnfk',
    actionText: 'Sponsor on Boosty',
  },
]
