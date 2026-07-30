# Third-party notices

Pi Agent Integrated contains vendored upstream source and installs optional runtime packages. The root [MIT license](LICENSE) applies to the integration-specific code and documentation; it does not replace the licenses of the components below.

## Vendored source

| Component | Version or baseline | License | Source |
| --- | --- | --- | --- |
| Pi | `0.83.0`, commit `bb226f9c1f38d3c029156a690e97bbfc602336b9` | MIT | <https://github.com/earendil-works/pi> |
| Pi Web | `0.8.4`, commit `c9b47e4543b11ce61e5c49c6bf02cea80aa975f6` | MIT | <https://github.com/agegr/pi-web> |

Their complete license texts remain in `pi/LICENSE` and `pi-web/LICENSE`.

## Runtime packages enabled by the managed profile

These packages are fetched from npm during setup or first use and remain under the ignored `data/` runtime directory.

| Package | Pinned version | License | Source |
| --- | --- | --- | --- |
| `pi-mcp-adapter` | `2.15.0` | MIT | <https://github.com/nicobailon/pi-mcp-adapter> |
| `pi-lens` | `3.8.73` | MIT | <https://github.com/apmantza/pi-lens> |
| `pi-memory` | `0.4.0` | MIT | <https://github.com/jayzeng/pi-memory> |
| `pi-subagents` | `0.37.2` | MIT | <https://github.com/nicobailon/pi-subagents> |
| `pi-smart-fetch` | `0.3.17` | MIT | <https://github.com/Thinkscape/agent-smart-fetch> |
| `@ayulab/pi-rewind` | `0.4.6` | GPL-3.0 | <https://github.com/ayu-exorcist/oh-my-pi> |
| `@upstash/context7-pi` | `0.1.2` | MIT | <https://github.com/upstash/context7> |
| `@narumitw/pi-retry` | `0.31.0` | MIT | <https://github.com/narumiruna/pi-extensions> |
| `@playwright/mcp` | `0.0.78` | Apache-2.0 | <https://github.com/microsoft/playwright-mcp> |

Each package may include transitive dependencies under additional licenses. npm package metadata and installed package license files are authoritative for a particular installation.
