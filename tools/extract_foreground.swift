import CoreImage
import Foundation
import ImageIO
import UniformTypeIdentifiers
import Vision

enum ExtractionError: Error, CustomStringConvertible {
    case invalidArguments
    case cannotLoadImage
    case invalidCrop
    case noForeground
    case cannotRenderMask
    case cannotWriteOutput

    var description: String {
        switch self {
        case .invalidArguments:
            return "Usage: extract_foreground <input> <x> <y> <width> <height> <output>"
        case .cannotLoadImage:
            return "Unable to load the source image."
        case .invalidCrop:
            return "The crop rectangle is outside the source image."
        case .noForeground:
            return "Vision did not detect a foreground subject in the crop."
        case .cannotRenderMask:
            return "Unable to render the foreground mask."
        case .cannotWriteOutput:
            return "Unable to write the transparent PNG."
        }
    }
}

func writePNG(_ image: CGImage, to url: URL) throws {
    try FileManager.default.createDirectory(
        at: url.deletingLastPathComponent(),
        withIntermediateDirectories: true
    )

    guard
        let destination = CGImageDestinationCreateWithURL(
            url as CFURL,
            UTType.png.identifier as CFString,
            1,
            nil
        )
    else {
        throw ExtractionError.cannotWriteOutput
    }

    CGImageDestinationAddImage(destination, image, nil)
    guard CGImageDestinationFinalize(destination) else {
        throw ExtractionError.cannotWriteOutput
    }
}

func run() throws {
    let args = CommandLine.arguments
    guard args.count == 7 || args.count == 8 else {
        throw ExtractionError.invalidArguments
    }

    let sourceURL = URL(fileURLWithPath: args[1])
    guard
        let source = CGImageSourceCreateWithURL(sourceURL as CFURL, nil),
        let image = CGImageSourceCreateImageAtIndex(source, 0, nil)
    else {
        throw ExtractionError.cannotLoadImage
    }

    let x = Int(args[2]) ?? -1
    let y = Int(args[3]) ?? -1
    let width = Int(args[4]) ?? 0
    let height = Int(args[5]) ?? 0
    let cropRect = CGRect(x: x, y: y, width: width, height: height)

    guard
        x >= 0,
        y >= 0,
        width > 0,
        height > 0,
        cropRect.maxX <= CGFloat(image.width),
        cropRect.maxY <= CGFloat(image.height),
        let croppedImage = image.cropping(to: cropRect)
    else {
        throw ExtractionError.invalidCrop
    }

    let input = CIImage(cgImage: croppedImage)
    let handler = VNImageRequestHandler(ciImage: input, options: [:])
    let request = VNGenerateObjectnessBasedSaliencyImageRequest()
    try handler.perform([request])

    guard let observation = request.results?.first else {
        throw ExtractionError.noForeground
    }

    let mask = CIImage(cvPixelBuffer: observation.pixelBuffer)
    let maskScaleX = input.extent.width / mask.extent.width
    let maskScaleY = input.extent.height / mask.extent.height
    let scaledMask = mask.transformed(
        by: CGAffineTransform(
            a: maskScaleX,
            b: 0,
            c: 0,
            d: maskScaleY,
            tx: input.extent.minX - mask.extent.minX * maskScaleX,
            ty: input.extent.minY - mask.extent.minY * maskScaleY
        )
    )
    let transparentBackground = CIImage(color: .clear).cropped(to: input.extent)
    let output = input.applyingFilter(
        "CIBlendWithMask",
        parameters: [
            kCIInputMaskImageKey: scaledMask,
            kCIInputBackgroundImageKey: transparentBackground,
        ]
    )

    let context = CIContext(options: [.useSoftwareRenderer: false])
    guard let result = context.createCGImage(output, from: input.extent) else {
        throw ExtractionError.cannotRenderMask
    }

    let outputURL = URL(fileURLWithPath: args[6])
    try writePNG(result, to: outputURL)

    if args.count == 8 {
        guard let maskImage = context.createCGImage(scaledMask, from: input.extent) else {
            throw ExtractionError.cannotRenderMask
        }
        try writePNG(maskImage, to: URL(fileURLWithPath: args[7]))
    }
}

do {
    try run()
} catch {
    FileHandle.standardError.write(Data("\(error)\n".utf8))
    exit(1)
}
