# Permisos de desarrollo

Este archivo documenta los comandos Bash que Claude Code tiene permitidos ejecutar sin confirmación durante el desarrollo de pad-hero. La configuración vive en `.claude/settings.local.json` (no se versiona fuera del proyecto).

## Criterios

Se incluyen sólo comandos **no destructivos** y necesarios para el ciclo de desarrollo normal. Comandos que modifican estado compartido, borran datos o afectan sistemas remotos requieren confirmación explícita cada vez.

## Permitidos

### Build y typecheck
| Comando | Para qué |
|---|---|
| `npx tsc ...` | Typecheck del proyecto (`--noEmit`, etc.) |
| `npm run ...` | Scripts de package.json: `build`, `dev`, `preview` |
| `npm install ...` | Instalar dependencias cuando se requiera |

### Exploración de archivos
| Comando | Para qué |
|---|---|
| `ls`, `tree` | Listar contenido de directorios |
| `find` | Localizar archivos por patrón |
| `grep`, `rg` | Búsqueda en contenido |
| `stat`, `file`, `wc`, `du`, `test`, `pwd` | Metadatos y checks de archivos |

### Operaciones de archivos seguras
| Comando | Para qué |
|---|---|
| `mkdir` | Crear directorios |
| `cp`, `rsync` | Copiar archivos (usado para `../pad-hero-play`) |

### Git (solo lectura)
| Comando | Para qué |
|---|---|
| `git status` | Estado del working tree |
| `git diff ...` | Ver cambios staged/unstaged |
| `git log ...` | Historial de commits |
| `git show ...` | Ver contenido de un commit |
| `git branch ...` | Listar/inspeccionar branches |

## NO permitidos (requieren confirmación siempre)

Aunque pueda necesitarlos, estos **no** están en el allowlist porque son destructivos, afectan estado remoto, o deben ser explícitos:

- `rm`, `rmdir` — borrado de archivos
- `git commit`, `git push`, `git reset --hard`, `git rebase`, `git checkout --`, `git clean`
- `git add` — staging, se hace sólo al pedir commit
- `curl`, `wget` — descargas
- `sudo` — operaciones con privilegios elevados
- Modificaciones a `package.json` vía `npm uninstall`, `npm update`
- Cualquier binario desconocido no explícitamente listado

## Cómo modificar

Editar `.claude/settings.local.json` y añadir/quitar entradas bajo `permissions.allow` usando el formato `Bash(<comando> <args>)` o `Bash(<comando>:*)` para permitir cualquier argumento.
