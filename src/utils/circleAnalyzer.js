// =========================================
// CIRCULARITY
// =========================================

export function calculateCircularity(points) {
  if (!points || points.length < 20) {
    return {
      score: 0,
      center: null,
      averageRadius: 0,
      deviation: 0,
    }
  }

  const centerX =
    points.reduce(
      (sum, point) => sum + point.x,
      0
    ) / points.length

  const centerY =
    points.reduce(
      (sum, point) => sum + point.y,
      0
    ) / points.length

  const center = {
    x: centerX,
    y: centerY,
  }

  const radii =
    points.map((point) =>
      Math.hypot(
        point.x - centerX,
        point.y - centerY
      )
    )

  const averageRadius =
    radii.reduce(
      (sum, radius) =>
        sum + radius,
      0
    ) / radii.length

  if (averageRadius === 0) {
    return {
      score: 0,
      center,
      averageRadius: 0,
      deviation: 0,
    }
  }

  const squaredDifferences =
    radii.map((radius) =>
      Math.pow(
        radius - averageRadius,
        2
      )
    )

  const variance =
    squaredDifferences.reduce(
      (sum, value) =>
        sum + value,
      0
    ) / radii.length

  const standardDeviation =
    Math.sqrt(variance)

  const normalizedDeviation =
    standardDeviation /
    averageRadius

  let score =
    100 -
    normalizedDeviation * 250

  score =
    Math.max(
      0,
      Math.min(100, score)
    )

  return {
    score: Math.round(score),
    center,
    averageRadius,
    deviation:
      normalizedDeviation,
  }
}


// =========================================
// CLOSURE
// =========================================

export function calculateClosure(points) {
  if (!points || points.length < 20) {
    return {
      score: 0,
      gapDistance: 0,
    }
  }

  const firstPoint =
    points[0]

  const lastPoint =
    points[
      points.length - 1
    ]

  const gapDistance =
    Math.hypot(
      lastPoint.x -
        firstPoint.x,

      lastPoint.y -
        firstPoint.y
    )

  const centerX =
    points.reduce(
      (sum, point) =>
        sum + point.x,
      0
    ) / points.length

  const centerY =
    points.reduce(
      (sum, point) =>
        sum + point.y,
      0
    ) / points.length

  const radii =
    points.map((point) =>
      Math.hypot(
        point.x - centerX,
        point.y - centerY
      )
    )

  const averageRadius =
    radii.reduce(
      (sum, radius) =>
        sum + radius,
      0
    ) / radii.length

  if (averageRadius === 0) {
    return {
      score: 0,
      gapDistance,
    }
  }

  const maxAllowedGap =
    averageRadius * 0.75

  let score =
    100 -
    (
      gapDistance /
      maxAllowedGap
    ) *
    100

  score =
    Math.max(
      0,
      Math.min(
        100,
        score
      )
    )

  return {
    score: Math.round(score),
    gapDistance,
  }
}


// =========================================
// SMOOTHNESS
// =========================================

export function calculateSmoothness(points) {
  if (!points || points.length < 20) {
    return {
      score: 0,
      roughness: 0,
    }
  }

  const angleChanges = []

  for (
    let i = 1;
    i < points.length - 1;
    i++
  ) {
    const previous =
      points[i - 1]

    const current =
      points[i]

    const next =
      points[i + 1]


    // اتجاه الحركة الأولى
    const angle1 =
      Math.atan2(
        current.y - previous.y,
        current.x - previous.x
      )


    // اتجاه الحركة الثانية
    const angle2 =
      Math.atan2(
        next.y - current.y,
        next.x - current.x
      )


    // الفرق بين الاتجاهين
    let angleDifference =
      angle2 - angle1


    // نخلي الزاوية ضمن -PI إلى PI
    angleDifference =
      Math.atan2(
        Math.sin(angleDifference),
        Math.cos(angleDifference)
      )


    angleChanges.push(
      Math.abs(
        angleDifference
      )
    )
  }


  if (angleChanges.length === 0) {
    return {
      score: 0,
      roughness: 0,
    }
  }


  // متوسط تغير الاتجاه
  const averageChange =
    angleChanges.reduce(
      (sum, value) =>
        sum + value,
      0
    ) /
    angleChanges.length


  // نقيس كم تغير الزوايا غير منتظم
  const variance =
    angleChanges.reduce(
      (sum, value) =>
        sum +
        Math.pow(
          value -
            averageChange,
          2
        ),
      0
    ) /
    angleChanges.length


  const roughness =
    Math.sqrt(
      variance
    )


  /*
    كلما كان تغير الاتجاه ثابت
    تكون الحركة أنعم.

    الاهتزازات الحادة ترفع roughness.
  */

  let score =
    100 -
    roughness * 180


  score =
    Math.max(
      0,
      Math.min(
        100,
        score
      )
    )


  return {
    score: Math.round(score),
    roughness,
  }
}