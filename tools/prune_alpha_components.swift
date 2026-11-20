import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

enum PruneError: Error, CustomStringConvertible {
    case invalidArguments
    case cannotLoadImage
    case cannotCreateContext
    case noForeground
    case cannotCreateOutput
    case cannotWrite

    var description: String {
        switch self {
        case .invalidArguments:
            return "Usage: prune_alpha_components <input.png> <output.png> [alpha-threshold] [padding]"
        case .cannotLoadImage:
            return "Unable to load input image."
        case .cannotCreateContext:
            return "Unable to create RGBA bitmap context."
        case .noForeground:
            return "No foreground pixels met the alpha threshold."
        case .cannotCreateOutput:
            return "Unable to create cropped output image."
        case .cannotWrite:
            return "Unable to write output PNG."
        }
    }
}

func readArguments() throws -> (URL, URL, UInt8, Int) {
    let args = CommandLine.arguments
    guard args.count == 3 || args.count == 4 || args.count == 5 else {
        throw PruneError.invalidArguments
    }
    let threshold = args.count >= 4 ? UInt8(args[3]) ?? 32 : 32
    let padding = args.count >= 5 ? Int(args[4]) ?? 16 : 16
    return (
        URL(fileURLWithPath: args[1]),
        URL(fileURLWithPath: args[2]),
        threshold,
        max(0, padding)
    )
}

func run() throws {
    let (inputURL, outputURL, threshold, padding) = try readArguments()
    guard
        let source = CGImageSourceCreateWithURL(inputURL as CFURL, nil),
        let image = CGImageSourceCreateImageAtIndex(source, 0, nil)
    else {
        throw PruneError.cannotLoadImage
    }

    let width = image.width
    let height = image.height
    let bytesPerRow = width * 4
    var pixels = [UInt8](repeating: 0, count: height * bytesPerRow)
    guard let context = CGContext(
        data: &pixels,
        width: width,
        height: height,
        bitsPerComponent: 8,
        bytesPerRow: bytesPerRow,
        space: CGColorSpaceCreateDeviceRGB(),
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    ) else {
        throw PruneError.cannotCreateContext
    }
    context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))

    var component = [Int32](repeating: -1, count: width * height)
    var componentAreas: [Int] = []
    var componentBounds: [(Int, Int, Int, Int)] = []
    var nextLabel: Int32 = 0

    for start in 0..<(width * height) where component[start] == -1 {
        let alpha = pixels[start * 4 + 3]
        if alpha < threshold {
            continue
        }

        let label = nextLabel
        nextLabel += 1
        component[start] = label
        var stack = [start]
        var area = 0
        var minX = start % width
        var maxX = minX
        var minY = start / width
        var maxY = minY

        while let current = stack.popLast() {
            area += 1
            let x = current % width
            let y = current / width
            minX = min(minX, x)
            maxX = max(maxX, x)
            minY = min(minY, y)
            maxY = max(maxY, y)

            for dy in -1...1 {
                for dx in -1...1 {
                    if dx == 0 && dy == 0 {
                        continue
                    }
                    let nx = x + dx
                    let ny = y + dy
                    if nx < 0 || nx >= width || ny < 0 || ny >= height {
                        continue
                    }
                    let index = ny * width + nx
                    if component[index] != -1 || pixels[index * 4 + 3] < threshold {
                        continue
                    }
                    component[index] = label
                    stack.append(index)
                }
            }
        }

        componentAreas.append(area)
        componentBounds.append((minX, minY, maxX, maxY))
    }

    guard let largestIndex = componentAreas.indices.max(by: {
        componentAreas[$0] < componentAreas[$1]
    }) else {
        throw PruneError.noForeground
    }
    let selectedLabel = Int32(largestIndex)
    let bounds = componentBounds[largestIndex]
    let cropX = max(0, bounds.0 - padding)
    let cropY = max(0, bounds.1 - padding)
    let cropMaxX = min(width, bounds.2 + padding + 1)
    let cropMaxY = min(height, bounds.3 + padding + 1)
    let cropWidth = cropMaxX - cropX
    let cropHeight = cropMaxY - cropY

    var output = [UInt8](repeating: 0, count: cropHeight * cropWidth * 4)
    for y in 0..<cropHeight {
        for x in 0..<cropWidth {
            let sourceX = cropX + x
            let sourceY = cropY + y
            let sourceIndex = sourceY * width + sourceX
            if component[sourceIndex] != selectedLabel {
                continue
            }
            let sourcePixel = sourceIndex * 4
            let outputPixel = (y * cropWidth + x) * 4
            output[outputPixel] = pixels[sourcePixel]
            output[outputPixel + 1] = pixels[sourcePixel + 1]
            output[outputPixel + 2] = pixels[sourcePixel + 2]
            output[outputPixel + 3] = pixels[sourcePixel + 3]
        }
    }

    guard let outputContext = CGContext(
        data: &output,
        width: cropWidth,
        height: cropHeight,
        bitsPerComponent: 8,
        bytesPerRow: cropWidth * 4,
        space: CGColorSpaceCreateDeviceRGB(),
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    ), let outputImage = outputContext.makeImage() else {
        throw PruneError.cannotCreateOutput
    }

    try FileManager.default.createDirectory(
        at: outputURL.deletingLastPathComponent(),
        withIntermediateDirectories: true
    )
    guard let destination = CGImageDestinationCreateWithURL(
        outputURL as CFURL,
        UTType.png.identifier as CFString,
        1,
        nil
    ) else {
        throw PruneError.cannotWrite
    }
    CGImageDestinationAddImage(destination, outputImage, nil)
    guard CGImageDestinationFinalize(destination) else {
        throw PruneError.cannotWrite
    }
}

do {
    try run()
} catch {
    FileHandle.standardError.write(Data("\(error)\n".utf8))
    exit(1)
}
