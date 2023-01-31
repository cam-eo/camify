import { Component, createSignal } from "solid-js";
import styles from "./App.module.css";
import tune from "./tune.mp3";

const App: Component = () => {
  const [chunks, setChunks] = createSignal([]);
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

      //#################################

      var dest = audioCtx.createMediaStreamDestination();

      var audio_stream = dest.stream;

      var canvas_stream = canvas.captureStream(60); // fps

      // connect our video element's output to the stream
      var sourceNode = audioCtx.createMediaElementSource(audio1);
      sourceNode.connect(dest);

      // Try to attach audio to canvasCaptureStream

      // navigator.mediaDevices
      //   .getUserMedia({ audio: true })
      //   .then((value: MediaStream) => {
      //     console.log("value: ", value);

      //     let audioTrack = value.getTracks();

      //     console.log("audioTrack: ", audioTrack);
      //   });

      const [videoTrack] = canvas_stream.getVideoTracks();
      const [audioTrack] = audioStream.getAudioTracks();
      const recordedStream = new MediaStream(videoTrack, audioTrack);
      const recorder = new MediaRecorder(recordedStream);

      const recordedStream = new MediaStream(canvas_stream, audioSource);

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

      //#################################

      let analyser = audioCtx.createAnalyser();

      audioSource.connect(analyser);
      analyser.connect(audioCtx.destination);
      analyser.fftSize = 128;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const barHeight = canvas.height / bufferLength;
          let y = 0;
          function animate() {
            y = 0;
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
            analyser.getByteFrequencyData(dataArray);

            for (
              let i = 0;
              i < bufferLength - Math.round(bufferLength * 0.15);
              i++
            ) {
              let barWidth = dataArray[i];

              // ctx.fillStyle = "white";
              ctx.strokeStyle = "red";
              // ctx.lineWidth = 4;

              ctx?.beginPath();

              ctx?.roundRect(
                canvas.width - barWidth - 4,
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
                canvas?.width - 4,
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
  }

  function recorder() {
    console.log("recording...");

    const audio1: HTMLAudioElement | null = document.getElementById(
      "audio"
    ) as HTMLAudioElement;

    const canvas: HTMLCanvasElement | null = document.getElementById(
      "canvas"
    ) as HTMLCanvasElement;

    var canvas_stream = canvas.captureStream(60); // fps

    // Request webcam with audio and user facing camera
    // navigator.mediaDevices
    //   .getUserMedia({ audio: true, video: { facingMode: "user" } })
    //   .then((media_stream) => {
    //     // Retrieve audio track
    //     let audio_track = media_stream.getAudioTracks()[0];
    //     // Assign media stream to video element - with audio muted
    //     let webcam_video = document.createElement("video");
    //     webcam_video.srcObject = media_stream;
    //     webcam_video.muted = true;
    //     webcam_video.style.display = "none";
    //     document.body.appendChild(webcam_video);
    //     // webcam_video.onplay = ;
    //     // And start playing
    //     webcam_video.play();

    //     canvas_stream.addTrack(audio_track);
    //   });

    // Create media recorder from canvas stream
    const media_recorder = new MediaRecorder(canvas_stream, {
      mimeType: "video/webm; codecs=vp9",
    });
    // Record data in chunks array when data is available
    media_recorder.ondataavailable = (evt) => {
      setChunks([...chunks(), evt.data]);
    };
    // Start recording using a 1s timeslice [ie data is made available every 1s)
    media_recorder.start(1000);
  }

  function on_media_recorder_stop() {
    console.log("download");
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

  return (
    <div class={styles.App}>
      <header class={styles.header}></header>
      <section>
        <button onclick={play}>Play</button>
        <canvas
          id="canvas"
          height={window.innerHeight}
          width={window.innerWidth / 2}
        ></canvas>
        <video
          src={tune}
          id="audio"
          // onplay={recorder}
          onended={on_media_recorder_stop}
        ></video>
      </section>
    </div>
  );
};

export default App;
