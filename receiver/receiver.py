import asyncio
import sys
import logging
from bless import (
    BlessServer,
    BlessGATTCharacteristic,
    GATTCharacteristicProperties,
    GATTAttributePermissions
)
from blessed import Terminal

# The same UUIDs used in the React Native App
SERVICE_UUID = "0000ffe0-0000-1000-8000-00805f9b34fb"
CHARACTERISTIC_UUID = "0000ffe1-0000-1000-8000-00805f9b34fb"

term = Terminal()

class WhisperReceiver:
    def __init__(self):
        self.current_transcription = ""

    def write_request(self, characteristic: BlessGATTCharacteristic, value: Any, **kwargs):
        try:
            # Decode the received data
            text = value.decode('utf-8')
            self.current_transcription += text
            self.display()
        except Exception as e:
            pass

    def display(self):
        print(term.clear())
        print(term.bold_blue("=== WhisperApp Bluetooth Receiver ==="))
        print(term.green(f"Status: Connected and Receiving..."))
        print("-" * 40)
        print(term.white(self.current_transcription))
        print("-" * 40)
        print(term.italic_gray("Waiting for more data... Press Ctrl+C to stop."))

async def main():
    receiver = WhisperReceiver()
    
    print(term.clear())
    print(term.bold_blue("=== WhisperApp Bluetooth Receiver ==="))
    print(term.yellow("Initializing Bluetooth Peripheral..."))

    # Set up the server
    server = BlessServer(name="WhisperLinux")
    server.read_request_func = lambda char: b""
    server.write_request_func = receiver.write_request

    # Add Service
    await server.add_new_service(SERVICE_UUID)

    # Add Characteristic
    # Properties: Write and Write Without Response
    # Permissions: Readable and Writeable
    char_flags = (
        GATTCharacteristicProperties.write |
        GATTCharacteristicProperties.write_without_response
    )
    permissions = (
        GATTAttributePermissions.readable |
        GATTAttributePermissions.writeable
    )
    
    await server.add_new_characteristic(
        SERVICE_UUID,
        CHARACTERISTIC_UUID,
        char_flags,
        None,
        permissions
    )

    print(term.green("Device is advertising as 'WhisperLinux'"))
    print(term.cyan(f"Service UUID: {SERVICE_UUID}"))
    
    await server.start()
    print(term.yellow("Waiting for connection from your phone..."))
    
    try:
        while True:
            await asyncio.sleep(1)
    finally:
        await server.stop()

if __name__ == "__main__":
    from typing import Any # Added for write_request signature
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print(term.red("\nReceiver stopped."))
        sys.exit(0)
    except Exception as e:
        print(term.red(f"\nAn error occurred: {e}"))
        sys.exit(1)
