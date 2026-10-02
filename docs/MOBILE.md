# Empacotar para Android e iOS (Capacitor)

O jogo é uma página web, então o [Capacitor](https://capacitorjs.com) embrulha o build em um app nativo.

## 1. Instalar

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init "Duelo Mágico" com.seudominio.duelomagico --web-dir dist
```

## 2. Gerar o build e as plataformas

```bash
npm run build
npx cap add android
npx cap add ios
npx cap sync
```

Sempre que mudar o código: `npm run build && npx cap sync`.

## 3. Abrir na IDE nativa

```bash
npx cap open android   # Android Studio: rodar no emulador/aparelho, gerar AAB
npx cap open ios       # Xcode: rodar no simulador/iPhone, Archive para a App Store
```

## Ajustes recomendados

- **Orientação travada em paisagem** (o jogo é horizontal)
  - Android: em `android/app/src/main/AndroidManifest.xml`, na `<activity>`, use `android:screenOrientation="sensorLandscape"`.
  - iOS: no Xcode, em *General → Deployment Info*, deixe marcados só **Landscape Left** e **Landscape Right**.
- **No navegador:** com o celular em pé, o `index.html` mostra o aviso "Gire o celular para jogar". Ao tocar em BATALHAR, o jogo tenta entrar em tela cheia e travar em paisagem (`screen.orientation.lock`). Isso funciona no Android/Chrome; o Safari do iPhone ignora o pedido.
- **Tela cheia / status bar:** plugin `@capacitor/status-bar` com `StatusBar.hide()`.
- **Áudio:** o iOS só libera áudio depois do primeiro toque. O Phaser já lida com isso (`sound.unlock`).
- **Notch:** o `index.html` já usa `viewport-fit=cover`. Se o HUD ficar atrás do notch, adicione margens com `env(safe-area-inset-top)`.

## Testar no celular sem empacotar

`npm run dev` já sobe com `--host`. Com o celular na mesma rede Wi-Fi, abra `http://IP-DO-COMPUTADOR:5180`.
