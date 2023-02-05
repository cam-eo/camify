import { Component, createSignal } from "solid-js";
import styles from "../App.module.css";
import tune from "../tune.mp3";

export const Mba: Component = () => {
  const [chunks, setChunks] = createSignal<Blob[]>([]);
  createSignal<MediaElementAudioSourceNode>();

  function play() {
    const audio1: HTMLAudioElement | null = document.getElementById(
      "audio"
    ) as HTMLAudioElement;

    const canvas: HTMLCanvasElement | null = document.getElementById(
      "canvas"
    ) as HTMLCanvasElement;

    if (audio1) {
      audio1.play();

      const audioCtx = new window.AudioContext();

      let audioSource = audioCtx.createMediaElementSource(audio1);

      // #################################
      var canvas_stream = canvas.captureStream(60); // fps

      // connect our video element's output to the stream
      const recordedStream = new MediaStream(canvas_stream);

      // Create media recorder from canvas stream
      const media_recorder = new MediaRecorder(recordedStream, {
        mimeType: "video/webm; codecs=vp9",
      });
      // Record data in chunks array when data is available
      media_recorder.ondataavailable = (evt) => {
        setChunks([...chunks(), evt.data]);
      };

      // Start recording using a 1s timeslice [ie data is made available every 1s)
      media_recorder.start(1000);
      // #################################

      let analyser = audioCtx.createAnalyser();

      audioSource.connect(analyser);
      analyser.connect(audioCtx.destination);
      analyser.fftSize = 128;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      if (canvas) {
        const ctx = canvas.getContext("2d");

        const canvasWidth = canvas?.width || 0;
        const visualiserWidth = canvasWidth / 2;
        const canvasHeight = canvas?.height || 0;

        const barHeight = canvas.height / bufferLength;
        let y = 0;
        function animate() {
          y = 0;
          ctx?.clearRect(0, 0, canvasWidth || 0, canvasHeight || 0);
          analyser.getByteFrequencyData(dataArray);

          for (
            let i = 0;
            i < bufferLength - Math.round(bufferLength * 0.15);
            i++
          ) {
            let barWidth = dataArray[i];

            ctx.strokeStyle = "red";

            ctx?.beginPath();

            ctx?.roundRect(
              visualiserWidth - barWidth - 2,
              y,
              barWidth,
              barHeight / 2,
              [barHeight / 2, 0, 0, barHeight / 2]
            );

            ctx?.stroke();

            ctx.fillStyle = "green";

            ctx?.fill();

            ctx?.closePath();

            ctx.fillStyle = "white";

            ctx?.fillRect(
              visualiserWidth - 4,
              0,
              4,
              (audio1?.currentTime / audio1?.duration) * canvas?.height
            );

            y += barHeight;
          }
          requestAnimationFrame(animate);
        }
        animate(); // recurse
      }
    }
  }

  function downloadRecordedCanvas() {
    // Gather chunks of video data into a blob and create an object URL
    var blob = new Blob(chunks(), { type: "video/webm" });
    const recording_url = URL.createObjectURL(blob);
    // Attach the object URL to an <a> element, setting the download file name
    const a = document.createElement("a");
    a.style = "display: none;";
    a.href = recording_url;
    a.download = "video.webm";
    document.body.appendChild(a);
    // Trigger the file download
    a.click();
    setTimeout(() => {
      // Clean up - see https://stackoverflow.com/a/48968694 for why it is in a timeout
      URL.revokeObjectURL(recording_url);
      document.body.removeChild(a);
    }, 0);
  }

  const resulution = {
    h: 1920,
    w: 1080,
  };

  return (
    <div class={styles.App}>
      <header class={styles.header}></header>
      <section>
        <button onclick={play}>Play</button>
        <canvas id="canvas" height={resulution.h} width={resulution.w}></canvas>
        <video src={tune} id="audio" onended={downloadRecordedCanvas}></video>
      </section>
    </div>
  );
};
