let wakeLock = null;

export async function requestWakeLock() {
  if ("wakeLock" in navigator) {
    try {
      wakeLock = await navigator.wakeLock.request("screen");
      console.log("Wake Lock activé");

      wakeLock.addEventListener("release", () => {
        console.warn("Wake Lock a été désactivé.");
      });
    } catch (err) {
      throw new Error("Erreur lors de l’activation du Wake Lock:" + err);
    }
  } else {
    console.log("L'API Wake Lock n'est pas disponible dans ce navigateur.");
  }
}

export async function releaseWakeLock() {
  if (wakeLock !== null) {
    await wakeLock.release();
    wakeLock = null;
    console.log("Wake Lock désactivé");
  }
}
