import { useEffect, useRef, useState } from 'react'

import {
  FilesetResolver,
  HandLandmarker,
} from '@mediapipe/tasks-vision'

import {
  calculateCircularity,
  calculateClosure,
  calculateSmoothness,
} from './utils/circleAnalyzer'

import mbmLogo from './assets/mbm-logo.png'

import './App.css'


function App() {
  // =========================================
  // REFS
  // =========================================

  const videoRef = useRef(null)
  const handLandmarkerRef = useRef(null)
  const animationFrameRef = useRef(null)

  const fingerDotRef = useRef(null)
  const canvasRef = useRef(null)

  const previousPointRef = useRef(null)
  const smoothedPointRef = useRef(null)

  const drawingPointsRef = useRef([])
  const drawingActiveRef = useRef(false)

  const gestureCandidateRef = useRef('idle')
  const gestureSinceRef = useRef(0)
  const activeGestureRef = useRef('idle')

  const handDetectedRef = useRef(false)
  const attemptFinishedRef = useRef(false)


  // =========================================
  // STATES
  // =========================================

  const [cameraStarted, setCameraStarted] =
    useState(false)

  const [cameraError, setCameraError] =
    useState('')

  const [modelLoaded, setModelLoaded] =
    useState(false)

  const [handDetected, setHandDetected] =
    useState(false)

  const [isDrawing, setIsDrawing] =
    useState(false)

  const [pointsCollected, setPointsCollected] =
    useState(0)

  const [circularityScore, setCircularityScore] =
    useState(null)

  const [smoothnessScore, setSmoothnessScore] =
    useState(null)

  const [closureScore, setClosureScore] =
    useState(null)

  const [finalScore, setFinalScore] =
    useState(null)

  const [displayScore, setDisplayScore] =
    useState(0)


  // =========================================
  // BEST SCORE
  // =========================================

  const [bestScore, setBestScore] =
    useState(() => {
      const savedScore =
        localStorage.getItem(
          'mbm-orbital-best-score'
        )

      return savedScore
        ? Number(savedScore)
        : 0
    })


  // =========================================
  // FINAL SCORE ANIMATION
  // =========================================

  useEffect(() => {
    if (finalScore === null) {
      setDisplayScore(0)
      return
    }

    let animationFrame

    const duration = 1200

    const startTime =
      performance.now()


    const animateScore = (
      currentTime
    ) => {
      const elapsed =
        currentTime - startTime

      const progress =
        Math.min(
          elapsed / duration,
          1
        )

      const easedProgress =
        1 -
        Math.pow(
          1 - progress,
          3
        )

      const currentScore =
        Math.round(
          finalScore *
          easedProgress
        )

      setDisplayScore(
        currentScore
      )

      if (progress < 1) {
        animationFrame =
          requestAnimationFrame(
            animateScore
          )
      }
    }


    animationFrame =
      requestAnimationFrame(
        animateScore
      )


    return () => {
      if (animationFrame) {
        cancelAnimationFrame(
          animationFrame
        )
      }
    }
  }, [finalScore])


  // =========================================
  // LOAD MEDIAPIPE
  // =========================================

  useEffect(() => {
    const loadHandLandmarker =
      async () => {
        try {
          const vision =
            await FilesetResolver.forVisionTasks(
              'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
            )

          const handLandmarker =
            await HandLandmarker.createFromOptions(
              vision,
              {
                baseOptions: {
                  modelAssetPath:
                    'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
                },

                runningMode: 'VIDEO',

                numHands: 1,
              }
            )

          handLandmarkerRef.current =
            handLandmarker

          setModelLoaded(true)

          console.log(
            'MediaPipe loaded successfully'
          )
        } catch (error) {
          console.error(
            'MediaPipe loading error:',
            error
          )
        }
      }

    loadHandLandmarker()
  }, [])


  // =========================================
  // START CAMERA
  // =========================================

  const startCamera =
    async () => {
      try {
        setCameraError('')

        const stream =
          await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          })

        if (videoRef.current) {
          videoRef.current.srcObject =
            stream
        }

        setCameraStarted(true)
      } catch (error) {
        console.error(error)

        setCameraError(
          'Camera access failed. Please allow camera permission.'
        )
      }
    }


  // =========================================
  // CLEAR DRAWING
  // =========================================

  const clearDrawing = () => {
    const canvas =
      canvasRef.current

    if (canvas) {
      const ctx =
        canvas.getContext('2d')

      ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      )
    }


    drawingPointsRef.current = []

    previousPointRef.current =
      null

    smoothedPointRef.current =
      null

    drawingActiveRef.current =
      false

    attemptFinishedRef.current =
      false


    gestureCandidateRef.current =
      'idle'

    activeGestureRef.current =
      'idle'

    gestureSinceRef.current =
      0


    setIsDrawing(false)

    setPointsCollected(0)

    setCircularityScore(null)

    setSmoothnessScore(null)

    setClosureScore(null)

    setFinalScore(null)

    setDisplayScore(0)


    console.log(
      'Drawing cleared'
    )
  }


  // =========================================
  // FINISH + ANALYZE
  // =========================================

  const finishDrawing = () => {
    const points =
      drawingPointsRef.current


    setPointsCollected(
      points.length
    )


    if (
      points.length >= 20
    ) {
      const circularityAnalysis =
        calculateCircularity(
          points
        )

      const smoothnessAnalysis =
        calculateSmoothness(
          points
        )

      const closureAnalysis =
        calculateClosure(
          points
        )


      // 50% Circularity
      // 30% Smoothness
      // 20% Closure

      const calculatedFinalScore =
        Math.round(
          circularityAnalysis.score *
            0.5 +

          smoothnessAnalysis.score *
            0.3 +

          closureAnalysis.score *
            0.2
        )


      setCircularityScore(
        circularityAnalysis.score
      )

      setSmoothnessScore(
        smoothnessAnalysis.score
      )

      setClosureScore(
        closureAnalysis.score
      )

      setFinalScore(
        calculatedFinalScore
      )


      // =====================================
      // BEST SCORE
      // =====================================

      setBestScore(
        (currentBest) => {
          if (
            calculatedFinalScore >
            currentBest
          ) {
            localStorage.setItem(
              'mbm-orbital-best-score',
              calculatedFinalScore.toString()
            )

            return calculatedFinalScore
          }

          return currentBest
        }
      )


      console.log(
        'Circularity:',
        circularityAnalysis
      )

      console.log(
        'Smoothness:',
        smoothnessAnalysis
      )

      console.log(
        'Closure:',
        closureAnalysis
      )

      console.log(
        'Final Score:',
        calculatedFinalScore
      )
    } else {
      setCircularityScore(0)

      setSmoothnessScore(0)

      setClosureScore(0)

      setFinalScore(0)

      console.log(
        'Not enough points'
      )
    }


    console.log(
      'Drawing finished'
    )

    console.log(
      'Collected points:',
      points
    )
  }


  // =========================================
  // FINGER EXTENDED CHECK
  // =========================================

  const isFingerExtended = (
    landmarks,
    tipIndex,
    pipIndex
  ) => {
    const wrist =
      landmarks[0]

    const tip =
      landmarks[tipIndex]

    const pip =
      landmarks[pipIndex]


    const tipDistance =
      Math.hypot(
        tip.x - wrist.x,
        tip.y - wrist.y
      )


    const pipDistance =
      Math.hypot(
        pip.x - wrist.x,
        pip.y - wrist.y
      )


    return (
      tipDistance >
      pipDistance * 1.12
    )
  }


  // =========================================
  // HAND TRACKING
  // =========================================

  useEffect(() => {
    if (
      !cameraStarted ||
      !modelLoaded
    ) {
      return
    }


    const detectHands = () => {
      const video =
        videoRef.current

      const handLandmarker =
        handLandmarkerRef.current


      if (
        video &&
        handLandmarker &&
        video.readyState >= 2
      ) {
        const now =
          performance.now()


        const results =
          handLandmarker.detectForVideo(
            video,
            now
          )


        // =====================================
        // HAND FOUND
        // =====================================

        if (
          results.landmarks &&
          results.landmarks.length >
            0
        ) {
          if (
            !handDetectedRef.current
          ) {
            handDetectedRef.current =
              true

            setHandDetected(
              true
            )
          }


          const landmarks =
            results.landmarks[0]


          const indexFingerTip =
            landmarks[8]


          // =====================================
          // FINGERS
          // =====================================

          const indexUp =
            isFingerExtended(
              landmarks,
              8,
              6
            )


          const middleUp =
            isFingerExtended(
              landmarks,
              12,
              10
            )


          const ringUp =
            isFingerExtended(
              landmarks,
              16,
              14
            )


          const pinkyUp =
            isFingerExtended(
              landmarks,
              20,
              18
            )


          // =====================================
          // GESTURES
          // =====================================

          let gesture =
            'idle'


          // ✊ CLEAR

          if (
            !indexUp &&
            !middleUp &&
            !ringUp &&
            !pinkyUp
          ) {
            gesture =
              'clear'
          }


          // ☝️ DRAW

          else if (
            indexUp &&
            !middleUp &&
            !ringUp &&
            !pinkyUp
          ) {
            gesture =
              'draw'
          }


          // ✌️ FINISH

          else if (
            indexUp &&
            middleUp &&
            !ringUp &&
            !pinkyUp
          ) {
            gesture =
              'stop'
          }


          // =====================================
          // GESTURE STABILITY
          // =====================================

          if (
            gestureCandidateRef.current !==
            gesture
          ) {
            gestureCandidateRef.current =
              gesture

            gestureSinceRef.current =
              now
          }


          const requiredGestureTime =
            gesture === 'clear'
              ? 600
              : 140


          const gestureStable =
            now -
              gestureSinceRef.current >
            requiredGestureTime


          if (
            gestureStable &&
            gesture !== 'idle' &&
            activeGestureRef.current !==
              gesture
          ) {
            activeGestureRef.current =
              gesture


            // =================================
            // ✊ CLEAR
            // =================================

            if (
              gesture === 'clear'
            ) {
              clearDrawing()


              activeGestureRef.current =
                'clear'

              gestureCandidateRef.current =
                'clear'

              gestureSinceRef.current =
                now


              console.log(
                'Drawing cleared by fist'
              )
            }


            // =================================
            // ☝️ DRAW
            // =================================

            if (
              gesture === 'draw' &&
              !attemptFinishedRef.current
            ) {
              drawingActiveRef.current =
                true


              setIsDrawing(
                true
              )


              drawingPointsRef.current =
                []


              previousPointRef.current =
                null


              smoothedPointRef.current =
                null


              setPointsCollected(
                0
              )


              setCircularityScore(
                null
              )

              setSmoothnessScore(
                null
              )

              setClosureScore(
                null
              )

              setFinalScore(
                null
              )

              setDisplayScore(
                0
              )


              const canvas =
                canvasRef.current


              if (canvas) {
                const ctx =
                  canvas.getContext(
                    '2d'
                  )

                ctx.clearRect(
                  0,
                  0,
                  canvas.width,
                  canvas.height
                )
              }


              console.log(
                'Drawing started'
              )
            }


            // =================================
            // ✌️ FINISH
            // =================================

            if (
              gesture === 'stop' &&
              drawingActiveRef.current
            ) {
              drawingActiveRef.current =
                false


              attemptFinishedRef.current =
                true


              setIsDrawing(
                false
              )


              previousPointRef.current =
                null


              finishDrawing()
            }
          }


          // =====================================
          // CANVAS
          // =====================================

          const canvas =
            canvasRef.current


          if (
            canvas &&
            video
          ) {
            const width =
              video.clientWidth


            const height =
              video.clientHeight


            if (
              canvas.width !==
                width ||
              canvas.height !==
                height
            ) {
              canvas.width =
                width

              canvas.height =
                height
            }


            const ctx =
              canvas.getContext(
                '2d'
              )


            // =====================================
            // RAW FINGER POSITION
            // =====================================

            const rawX =
              (
                1 -
                indexFingerTip.x
              ) *
              canvas.width


            const rawY =
              indexFingerTip.y *
              canvas.height


            // =====================================
            // SMOOTHING
            // =====================================

            const smoothing =
              0.28


            if (
              !smoothedPointRef.current
            ) {
              smoothedPointRef.current =
                {
                  x: rawX,
                  y: rawY,
                }
            } else {
              smoothedPointRef.current.x +=
                (
                  rawX -
                  smoothedPointRef
                    .current.x
                ) *
                smoothing


              smoothedPointRef.current.y +=
                (
                  rawY -
                  smoothedPointRef
                    .current.y
                ) *
                smoothing
            }


            const currentPoint =
              {
                x:
                  smoothedPointRef
                    .current.x,

                y:
                  smoothedPointRef
                    .current.y,
              }


            // =====================================
            // FINGER NEON ORB
            // =====================================

            if (
              fingerDotRef.current
            ) {
              fingerDotRef.current.style.display =
                'block'


              fingerDotRef.current.style.left =
                `${
                  (
                    currentPoint.x /
                    canvas.width
                  ) *
                  100
                }%`


              fingerDotRef.current.style.top =
                `${
                  (
                    currentPoint.y /
                    canvas.height
                  ) *
                  100
                }%`
            }


            // =====================================
            // DRAWING
            // =====================================

            if (
              drawingActiveRef.current
            ) {
              const points =
                drawingPointsRef.current


              const lastStoredPoint =
                points[
                  points.length -
                    1
                ]


              // =================================
              // STORE POINTS
              // =================================

              if (
                !lastStoredPoint
              ) {
                points.push({
                  ...currentPoint,
                })
              } else {
                const distance =
                  Math.hypot(
                    currentPoint.x -
                      lastStoredPoint.x,

                    currentPoint.y -
                      lastStoredPoint.y
                  )


                if (
                  distance > 2
                ) {
                  points.push({
                    ...currentPoint,
                  })
                }
              }


              // =================================
              // NEON TRAIL
              // =================================

              if (
                previousPointRef.current
              ) {
                const previous =
                  previousPointRef.current


                const middleX =
                  (
                    previous.x +
                    currentPoint.x
                  ) /
                  2


                const middleY =
                  (
                    previous.y +
                    currentPoint.y
                  ) /
                  2


                ctx.beginPath()


                ctx.moveTo(
                  previous.x,
                  previous.y
                )


                ctx.quadraticCurveTo(
                  previous.x,
                  previous.y,
                  middleX,
                  middleY
                )


                ctx.strokeStyle =
                  '#65ffb0'


                ctx.lineWidth =
                  7


                ctx.lineCap =
                  'round'


                ctx.lineJoin =
                  'round'


                ctx.shadowColor =
                  '#54e8ff'


                ctx.shadowBlur =
                  18


                ctx.stroke()
              }


              previousPointRef.current =
                {
                  ...currentPoint,
                }
            } else {
              previousPointRef.current =
                null
            }
          }
        }


        // =====================================
        // NO HAND
        // =====================================

        else {
          if (
            handDetectedRef.current
          ) {
            handDetectedRef.current =
              false

            setHandDetected(
              false
            )
          }


          previousPointRef.current =
            null


          smoothedPointRef.current =
            null


          gestureCandidateRef.current =
            'idle'


          activeGestureRef.current =
            'idle'


          if (
            fingerDotRef.current
          ) {
            fingerDotRef.current.style.display =
              'none'
          }
        }
      }


      animationFrameRef.current =
        requestAnimationFrame(
          detectHands
        )
    }


    detectHands()


    return () => {
      if (
        animationFrameRef.current
      ) {
        cancelAnimationFrame(
          animationFrameRef.current
        )
      }
    }
  }, [
    cameraStarted,
    modelLoaded,
  ])


  // =========================================
  // STOP CAMERA ON EXIT
  // =========================================

  useEffect(() => {
    return () => {
      if (
        videoRef.current?.srcObject
      ) {
        const tracks =
          videoRef.current
            .srcObject
            .getTracks()


        tracks.forEach(
          (track) => {
            track.stop()
          }
        )
      }
    }
  }, [])


  // =========================================
  // SCORE LABEL
  // =========================================

  const getScoreLabel = () => {
    if (
      finalScore === null
    ) {
      return 'Waiting for attempt'
    }


    if (
      finalScore >= 95
    ) {
      return 'LEGENDARY CIRCLE'
    }


    if (
      finalScore >= 90
    ) {
      return 'MASTERFUL'
    }


    if (
      finalScore >= 80
    ) {
      return 'EXCELLENT'
    }


    if (
      finalScore >= 70
    ) {
      return 'GREAT CIRCLE'
    }


    if (
      finalScore >= 50
    ) {
      return 'GOOD ATTEMPT'
    }


    return 'TRY AGAIN'
  }


  // =========================================
  // UI
  // =========================================

  return (
    <div className="app">


      {/* HEADER */}

      <header className="header">


        {/* MBM BRAND */}

        <div className="brand">

          <div className="brand-logo-container">

            <img
              src={mbmLogo}
              alt="MBM - Modern Build Minds"
              className="brand-logo"
            />

          </div>


          <div className="brand-text">

            <h2>
              MBM
            </h2>

            <span>
              ORBITAL
            </span>

          </div>

        </div>


        <div className="header-title">

          <span>
            INTERACTIVE MOTION EXPERIENCE
          </span>

        </div>


        {/* BEST SCORE */}

        <div className="best-score">

          <span>
            BEST SCORE
          </span>

          <strong>
            {bestScore}%
          </strong>

        </div>


      </header>


      {/* MAIN */}

      <main className="main-content">


        {/* INTRO */}

        <section className="intro-section">


          <span className="small-title">
            MBM INTERACTIVE LAB
          </span>


          <h1>

            Draw the

            <span>
              {' '}
              Perfect Circle
            </span>

          </h1>


          <p>
            Use your hand to control the experience.
            Raise your index finger to draw, show two
            fingers to finish, or hold a fist to clear.
          </p>


          <button
            className="start-button"
            onClick={startCamera}
          >

            {cameraStarted
              ? 'Camera Active'
              : 'Start Experience'}

          </button>


          <button
            className="clear-button"
            onClick={clearDrawing}
          >
            Clear Drawing
          </button>


          {/* SYSTEM STATUS */}

          <div className="system-status">


            <div>

              <span
                className={
                  modelLoaded
                    ? 'status-dot ready'
                    : 'status-dot'
                }
              ></span>


              {modelLoaded
                ? 'AI Model Ready'
                : 'Loading AI Model...'}

            </div>


            <div>

              <span
                className={
                  handDetected
                    ? 'status-dot ready'
                    : 'status-dot'
                }
              ></span>


              {handDetected
                ? 'Hand Detected'
                : 'No Hand Detected'}

            </div>


          </div>


          {cameraError && (

            <p className="camera-error">
              {cameraError}
            </p>

          )}


        </section>


        {/* CAMERA */}

        <section className="camera-card">


          <div className="camera-top">


            <span className="live-status">


              <span
                className={
                  cameraStarted
                    ? 'live-dot'
                    : 'live-dot inactive'
                }
              ></span>


              {cameraStarted
                ? 'LIVE CAMERA'
                : 'CAMERA'}


            </span>


            <span>

              {!handDetected
                ? 'WAITING FOR HAND'

                : isDrawing
                  ? 'DRAWING ACTIVE'

                  : attemptFinishedRef.current
                    ? 'ATTEMPT COMPLETE'

                    : 'HAND DETECTED'}

            </span>


          </div>


          <div className="camera-placeholder">


            {/* CAMERA VIDEO */}

            <video
              ref={videoRef}
              className="camera-video"
              autoPlay
              playsInline
              muted
            />


            {/* DRAWING CANVAS */}

            <canvas
              ref={canvasRef}
              className="drawing-canvas"
            />


            {/* FINGER TRACKER */}

            <div
              ref={fingerDotRef}

              className={
                isDrawing
                  ? 'finger-tracker drawing'
                  : 'finger-tracker'
              }
            >

              <div className="finger-core">
              </div>

            </div>


            {/* CAMERA WAITING */}

            {!cameraStarted && (

              <div className="camera-waiting">


                <div className="tracking-circle">

                  <div className="finger-point">
                  </div>

                </div>


                <p>
                  Camera preview will appear here
                </p>


              </div>

            )}


            {/* HAND STATUS */}

            {cameraStarted && (

              <div
                className={
                  handDetected
                    ? 'hand-status detected'
                    : 'hand-status'
                }
              >

                {handDetected
                  ? '✓ HAND DETECTED'
                  : 'SHOW YOUR HAND'}

              </div>

            )}


          </div>


          {/* CONTROL HELP */}

          <div className="camera-help">


            {!handDetected

              ? '☝️ Raise your hand'

              : isDrawing

                ? '☝️ Drawing • ✌️ Finish • ✊ Clear'

                : pointsCollected > 0

                  ? `✦ Circle captured — ${pointsCollected} points • ✊ Hold fist to clear`

                  : '☝️ Draw • ✌️ Finish • ✊ Hold to Clear'}


          </div>


        </section>


        {/* SCORE CARD */}

        <section
          className={
            finalScore === null
              ? 'score-card'

              : finalScore >= 95
                ? 'score-card result legendary-card'

                : 'score-card result'
          }
        >


          <span className="score-title">
            CIRCLE ACCURACY
          </span>


          {/* FINAL SCORE */}

          <div
            className={
              finalScore === null
                ? 'score-number'

                : finalScore >= 95
                  ? 'score-number legendary'

                  : finalScore >= 80
                    ? 'score-number excellent'

                    : 'score-number active'
            }
          >

            {finalScore !== null
              ? displayScore
              : '--'}

            <span>
              %
            </span>

          </div>


          {/* RESULT LABEL */}

          <h3
            className={
              finalScore !== null
                ? 'result-label visible'
                : 'result-label'
            }
          >

            {getScoreLabel()}

          </h3>


          <p>

            {finalScore === null
              ? 'Draw your circle to reveal your score.'
              : 'Your circle analysis is complete.'}

          </p>


          {/* CIRCULARITY */}

          <div className="metric">


            <div>

              <span>
                Circularity
              </span>

              <span>

                {circularityScore !== null
                  ? `${circularityScore}%`
                  : '--%'}

              </span>

            </div>


            <div className="metric-bar">

              <div
                style={{
                  width:
                    circularityScore !== null
                      ? `${circularityScore}%`
                      : '0%',
                }}
              ></div>

            </div>


          </div>


          {/* SMOOTHNESS */}

          <div className="metric">


            <div>

              <span>
                Smoothness
              </span>

              <span>

                {smoothnessScore !== null
                  ? `${smoothnessScore}%`
                  : '--%'}

              </span>

            </div>


            <div className="metric-bar">

              <div
                style={{
                  width:
                    smoothnessScore !== null
                      ? `${smoothnessScore}%`
                      : '0%',
                }}
              ></div>

            </div>


          </div>


          {/* CLOSURE */}

          <div className="metric">


            <div>

              <span>
                Closure
              </span>

              <span>

                {closureScore !== null
                  ? `${closureScore}%`
                  : '--%'}

              </span>

            </div>


            <div className="metric-bar">

              <div
                style={{
                  width:
                    closureScore !== null
                      ? `${closureScore}%`
                      : '0%',
                }}
              ></div>

            </div>


          </div>


        </section>


      </main>


    </div>
  )
}


export default App