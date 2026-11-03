import React, { useMemo, useRef, useState } from "react";

const LensViewer = ({
  sanitizedImagePath,
  sanitizedUpscaledImagePath,
}: {
  sanitizedImagePath: string;
  sanitizedUpscaledImagePath: string;
}) => {
  const originalImageContainerRef = useRef<HTMLDivElement>(null);
  const originalImageRef = useRef<HTMLImageElement>(null);

  const [hoverPosition, setHoverPosition] = useState({
    relativeMouseX: 0,
    mouseY: 0,
    relativeMouseXPercent: 0,
    relativeMouseYPercent: 0,
    originalImageMouseX: 0,
    originalImageMouseY: 0,
  });
  const zoomLevel = 4;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!originalImageRef.current || !originalImageContainerRef.current) return;

    const containerRect =
      originalImageContainerRef.current.getBoundingClientRect();

    let viewportImageWidth = originalImageRef.current.width;
    let viewportImageHeight = originalImageRef.current.height;
    let imageTop = 0;
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const containerHeight = containerRect.height;
    const containerLeft = containerRect.left;
    const containerTop = containerRect.top;

    const originalImageAspectRatio =
      originalImageRef.current.naturalWidth /
      originalImageRef.current.naturalHeight;
    viewportImageHeight = viewportImageWidth / originalImageAspectRatio;
    imageTop = (containerHeight - viewportImageHeight) / 2;

    const relativeMouseX = mouseX - containerLeft;
    const relativeMouseY = mouseY - imageTop;

    const isWithinImage =
      relativeMouseX >= 0 &&
      relativeMouseX <= viewportImageWidth &&
      relativeMouseY >= 0 &&
      relativeMouseY <= viewportImageHeight;

    if (!isWithinImage) {
      setHoverPosition({
        relativeMouseXPercent: -1000,
        relativeMouseYPercent: -1000,
        relativeMouseX: -1000,
        mouseY: -1000,
        originalImageMouseX: -1000,
        originalImageMouseY: -1000,
      });
      return;
    }

    const relativeMouseXPercent = (relativeMouseX / viewportImageWidth) * 100;
    const relativeMouseYPercent = (relativeMouseY / viewportImageHeight) * 100;

    const bgPosX =
      (relativeMouseX / viewportImageWidth) *
      originalImageRef.current.naturalWidth;
    const bgPosY =
      (relativeMouseY / viewportImageHeight) *
      originalImageRef.current.naturalHeight;

    setHoverPosition({
      relativeMouseXPercent,
      relativeMouseYPercent,
      relativeMouseX,
      mouseY,
      originalImageMouseX: bgPosX,
      originalImageMouseY: bgPosY,
    });
  };

  const originalImage = useMemo(
    () => "media:///" + sanitizedImagePath,
    [sanitizedImagePath],
  );
  const upscaledImage = useMemo(
    () => "media:///" + sanitizedUpscaledImagePath,
    [sanitizedUpscaledImagePath],
  );

  return (
    <div className="group relative flex h-full flex-col items-center">
      <div
        className="relative h-full w-full cursor-crosshair"
        ref={originalImageContainerRef}
      >
        ORIGINAL IMAGE
        <img
          src={originalImage}
          alt="Original"
          className="h-full w-full object-contain"
          onMouseMove={handleMouseMove}
          ref={originalImageRef}
        />
        <div
          className="pointer-events-none absolute hidden cursor-cell border border-primary bg-black/10 group-hover:block"
          style={{
            left: `${hoverPosition.relativeMouseX}px`,
            top: `${hoverPosition.mouseY}px`,
            transform: "translate(-50%, -50%)",
            height: `48px`,
            width: `48px`,
          }}
        />
      </div>

      <div
        className="pointer-events-none absolute hidden group-hover:flex"
        style={{
          left: `${hoverPosition.relativeMouseX}px`,
          top: `${hoverPosition.mouseY + 25}px`,
          transform: "translate(-50%, 0)",
        }}
      >
        <div
          className="relative h-48 w-48 border border-gray-300 bg-cover bg-no-repeat"
          style={{
            backgroundImage: `url(${originalImage})`,
            backgroundPosition: `-${hoverPosition.originalImageMouseX * zoomLevel - 96}px -${hoverPosition.originalImageMouseY * zoomLevel - 96}px`,
            backgroundSize: `${originalImageRef.current?.naturalWidth * zoomLevel}px ${originalImageRef.current?.naturalHeight * zoomLevel}px`,
          }}
        >
          <span className="absolute bottom-0 w-full bg-black bg-opacity-60 px-2 py-1 text-center text-xs text-white">
            Original
          </span>
        </div>
        <div
          className="relative h-48 w-48 border border-gray-300 bg-cover bg-no-repeat"
          style={{
            backgroundImage: `url(${upscaledImage})`,
            backgroundPosition: `-${hoverPosition.originalImageMouseX * zoomLevel - 96}px -${hoverPosition.originalImageMouseY * zoomLevel - 96}px`,
            backgroundSize: `${originalImageRef.current?.naturalWidth * zoomLevel}px ${originalImageRef.current?.naturalHeight * zoomLevel}px`,
          }}
        >
          <span className="absolute bottom-0 w-full bg-black bg-opacity-60 px-2 py-1 text-center text-xs text-white">
            Upscayl AI
          </span>
        </div>
      </div>
    </div>
  );
};

export default LensViewer;
