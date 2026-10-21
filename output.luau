type Result<T> = {
	value: T,
	error: string,
}
type Processor<T> = {
	process: number,
	reset: () -> (),
}
local C_Pipeline = {}

local C_Static_Pipeline = {}
C_Static_Pipeline.__index = C_Pipeline

local C_Instance_Pipeline = {}
C_Instance_Pipeline.__index = C_Instance_Pipeline

setmetatable(C_Pipeline, C_Static_Pipeline)
function C_Pipeline.new(processors: Processor<any>, callback: (result: Result<any>) -> ())
	local self = setmetatable({}, C_Instance_Pipeline)
	self.processors = processors
	self.callback = callback
	return self
end
function C_Instance_Pipeline:run(value: any)
	local result: Result<any> = self.processors.process
	if result.error ~= "" then
		self.callback(result)
	end
	return result
end

local function resetFunc()
	print("reset?")
end
local function callback<T>(result: Result<T>)
	print("idk")
end
local myClass: any = C_Pipeline.new({ process = 1, reset = resetFunc }, callback)
myClass.run(5)
