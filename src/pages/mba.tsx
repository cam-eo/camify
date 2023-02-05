import { Component, createSignal } from "solid-js";
import styles from "../App.module.css";
import tune from "../tune.mp3";

export const Mba: Component = () => {
  const resolution = {
    h: 1000,
    w: 1000,
  };
  const [chunks, setChunks] = createSignal<Blob[]>([]);
  createSignal<MediaElementAudioSourceNode>();

  const colors = [
    {
      stroke: "rgb(233, 84, 28)",
      fill: "rgb(107,2,3)",
    },
    {
      stroke: "white",
      fill: "rgb(100, 165, 102)",
    },
    {
      stroke: "rgb(227, 189, 16)",
      fill: "rgb(114, 198, 209)",
    },
    {
      stroke: "rgb(163, 19, 24)",
      fill: "rgb(22, 11, 96)",
    },
  ];

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

          for (let i in colors) {
            const circleSizeRatio = 1.7 - i / colors.length;
            ctx.lineWidth = 100;
            ctx.strokeStyle = colors[i].stroke;
            ctx?.beginPath();
            ctx?.arc(
              resolution.w / 2,
              resolution.h / 2,
              dataArray[i * 10] * circleSizeRatio,
              0,
              2 * Math.PI
            );
            ctx.fillStyle = colors[i].fill;
            ctx?.stroke();
            ctx?.fill();
            ctx?.closePath();
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

  function pause() {
    const audio1: HTMLAudioElement | null = document.getElementById(
      "audio"
    ) as HTMLAudioElement;

    if (audio1) {
      audio1.pause();
    }
  }

  return (
    <div
    // style={{ "background-color": "green" }}
    >
      <header class={styles.header}></header>
      <section>
        <button onclick={play}>Play</button>
        <button onclick={pause}>Pause</button>
        <canvas
          //   style={{ "background-color": "green" }}
          id="canvas"
          height={resolution.h}
          width={resolution.w}
        ></canvas>
        <audio src={tune} id="audio" onended={downloadRecordedCanvas}></audio>
      </section>
    </div>
  );
};
