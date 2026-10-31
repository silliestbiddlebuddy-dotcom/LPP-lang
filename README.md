# L++ - Made to be enjoyed
L++ is a **strongly** and **statically** typed, compiled language made 100% in TypeScript,\
It follows a simple philosophy: "***Programming should be easy and enjoyable***"

## Pre-requirements
To use or install the L++ compiler/toolchain you'll need these tools:
- Node.js 24 or more
- Git
- LLVM and Clang

  
To install Node.js go to the [installation page](https://nodejs.org/en/download) and follow the instructions,
same for [Git](https://git-scm.com/install/).\
to install the LLVM toolchain and clang you'll need to use your package manager, here are some examples:
### Windows


#### Winget
```bash
winget install LLVM.LLVM
```
#### Chocolatey
```bash
choco install llvm
```

### MacOS
```bash
brew install llvm
```


### Linux


#### Fedora/RHEL/Alma Linux
```bash
sudo dnf install llvm clang
```
#### Arch Linux
```bash
sudo pacman -S llvm clang
```
#### Ubuntu/Debian/Linux Mint/Pop!_OS/Kali linux 
```bash
sudo apt install llvm clang
```
#### Void Linux
```bash
sudo xbps-install -S llvm clang
```
#### openSUSE
```bash
sudo zypper install llvm clang
```
#### Alpine Linux
```bash
sudo apk add llvm clang
```
#### Gentoo Linux
```bash
sudo emerge --sync
sudo emerge --ask llvm-core/llvm llvm-core/clang
```
#### NixOS
add the packages to your configuration:
```nix
environment.systemPackages = with pkgs; [
    llvm
    clang
];
```
then apply:
```bash
sudo nixos-rebuild switch
```

## Installation
Once you've installed Git Node.js and the LLVM toolchain you'll have to clone the repo:
```bash
git clone https://github.com/silliestbiddlebuddy-dotcom/LPP-lang/ lpp
cd lpp
```
Install the project's dependencies: 
```bash
npm install
```
if some packages need funding or audit, fix them with:
```bash
npm fund
npm audit fix
```
now link the CLI:
```
npm link
```
if it gives you an ownership error try to change node_module's owner:
```bash
sudo chown -R $USER node_modules
```
## Usage
To use the CLI, i'll show you a table with all the commands:
| Command | What it does |
|---|---|
| `lpp build <directory> [options]` | Builds all `.lpp` files in a directory. |
| `lpp compile <file.lpp> [options]` | Compiles a single `.lpp` source file. |
| `lpp compileToLLVM <file.lpp> [options]` | Generates LLVM IR from a single `.lpp` source file. |
| `lpp compileLLVM <files...> [options]` | Compiles one or more LLVM files into executables. |
| `lpp init-config [directory] [options]` | Creates an LppConfig.jsonc configuration file. |


if you want to see the CLI options refer to this [file](

